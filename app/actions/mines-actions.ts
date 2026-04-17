"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPlayerBalance } from "./gambling-actions";
import type { MinesGameState } from "@/types";
import crypto from "crypto";

const GRID_SIZE = 25; // 5x5
const MAX_DAILY_GAMES = 3;
const HOUSE_EDGE = 0.03; // 3%

// ── Helpers ─────────────────────────────────────────────────

async function getCurrentPlayerId(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("players")
    .select("id")
    .eq("user_id", user.id)
    .single();
  return data?.id ?? null;
}

function generateMines(numMines: number, seed: string): number[] {
  const mines = new Set<number>();
  let i = 0;
  while (mines.size < numMines) {
    const hash = crypto.createHash("sha256").update(seed + ":" + i).digest("hex");
    const position = parseInt(hash.substring(0, 8), 16) % GRID_SIZE;
    if (!mines.has(position)) mines.add(position);
    i++;
  }
  return Array.from(mines).sort((a, b) => a - b);
}

function calculateMultiplier(totalTiles: number, numMines: number, revealed: number): number {
  if (revealed === 0) return 1;
  let multiplier = 1;
  for (let step = 0; step < revealed; step++) {
    multiplier *= (totalTiles - step) / (totalTiles - numMines - step);
  }
  return multiplier * (1 - HOUSE_EDGE);
}

function calculateNextMultiplier(totalTiles: number, numMines: number, revealed: number): number {
  return calculateMultiplier(totalTiles, numMines, revealed + 1);
}

// ── Public actions ──────────────────────────────────────────

export async function getMinesDailyCount(playerId: string): Promise<number> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase
    .from("mines_games")
    .select("*", { count: "exact", head: true })
    .eq("player_id", playerId)
    .gte("created_at", today + "T00:00:00Z")
    .lt("created_at", today + "T23:59:59.999Z");
  return count ?? 0;
}

export async function getActiveMinesGame(playerId: string): Promise<MinesGameState | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mines_games")
    .select("*")
    .eq("player_id", playerId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const revealed = (data.revealed as number[]) ?? [];
  const multiplier = calculateMultiplier(GRID_SIZE, data.num_mines, revealed.length);
  const nextMultiplier = calculateNextMultiplier(GRID_SIZE, data.num_mines, revealed.length);

  return {
    id: data.id,
    wager: data.wager,
    num_mines: data.num_mines,
    revealed,
    multiplier,
    nextMultiplier,
    status: "active",
    payout: 0,
    // Don't expose mine positions while game is active
  };
}

export async function startMinesGame(
  wager: number,
  numMines: number
): Promise<{ error?: string; game?: MinesGameState }> {
  if (wager <= 0) return { error: "L'aposta ha de ser positiva." };
  if (numMines < 1 || numMines > 24) return { error: "Nombre de mines invàlid (1-24)." };

  const supabase = await createClient();
  const playerId = await getCurrentPlayerId(supabase);
  if (!playerId) return { error: "No s'ha pogut identificar l'usuari." };

  // Check for active game
  const active = await getActiveMinesGame(playerId);
  if (active) return { error: "Ja tens una partida activa. Acaba-la primer." };

  // Daily limit
  const dailyCount = await getMinesDailyCount(playerId);
  if (dailyCount >= MAX_DAILY_GAMES) {
    return { error: `Has arribat al límit de ${MAX_DAILY_GAMES} partides diàries.` };
  }

  // Balance
  const balance = await getPlayerBalance(playerId);
  if (wager > balance) return { error: `No tens prou punts. Saldo: ${balance}` };

  // Generate game
  const serverSeed = crypto.randomBytes(32).toString("hex");
  const minePositions = generateMines(numMines, serverSeed);

  const { data, error } = await supabase
    .from("mines_games")
    .insert({
      player_id: playerId,
      wager,
      num_mines: numMines,
      mine_positions: minePositions,
      revealed: [],
      server_seed: crypto.createHash("sha256").update(serverSeed).digest("hex"),
      status: "active",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/gambling");

  return {
    game: {
      id: data.id,
      wager,
      num_mines: numMines,
      revealed: [],
      multiplier: 1,
      nextMultiplier: calculateNextMultiplier(GRID_SIZE, numMines, 0),
      status: "active",
      payout: 0,
    },
  };
}

export async function revealTile(
  gameId: string,
  tileIndex: number
): Promise<{ error?: string; game?: MinesGameState }> {
  if (tileIndex < 0 || tileIndex >= GRID_SIZE) return { error: "Casella invàlida." };

  const supabase = await createClient();
  const playerId = await getCurrentPlayerId(supabase);
  if (!playerId) return { error: "No s'ha pogut identificar l'usuari." };

  const { data } = await supabase
    .from("mines_games")
    .select("*")
    .eq("id", gameId)
    .eq("player_id", playerId)
    .eq("status", "active")
    .single();

  if (!data) return { error: "Partida no trobada o ja finalitzada." };

  const revealed = (data.revealed as number[]) ?? [];
  const minePositions = data.mine_positions as number[];

  if (revealed.includes(tileIndex)) return { error: "Casella ja revelada." };

  const isMine = minePositions.includes(tileIndex);
  const newRevealed = [...revealed, tileIndex];

  if (isMine) {
    // BOOM — lose everything
    await supabase
      .from("mines_games")
      .update({
        revealed: newRevealed,
        status: "exploded",
        payout: 0,
        multiplier: 0,
      })
      .eq("id", gameId);

    revalidatePath("/gambling");

    return {
      game: {
        id: gameId,
        wager: data.wager,
        num_mines: data.num_mines,
        revealed: newRevealed,
        multiplier: 0,
        nextMultiplier: 0,
        status: "exploded",
        payout: 0,
        minePositions,
      },
    };
  }

  // Safe tile
  const multiplier = calculateMultiplier(GRID_SIZE, data.num_mines, newRevealed.length);
  const safeTilesLeft = GRID_SIZE - data.num_mines - newRevealed.length;

  // Auto-cashout if all safe tiles revealed
  if (safeTilesLeft === 0) {
    const payout = Math.floor(data.wager * multiplier);
    await supabase
      .from("mines_games")
      .update({
        revealed: newRevealed,
        status: "cashed_out",
        payout,
        multiplier,
      })
      .eq("id", gameId);

    revalidatePath("/gambling");

    return {
      game: {
        id: gameId,
        wager: data.wager,
        num_mines: data.num_mines,
        revealed: newRevealed,
        multiplier,
        nextMultiplier: 0,
        status: "cashed_out",
        payout,
        minePositions,
      },
    };
  }

  const nextMultiplier = calculateNextMultiplier(GRID_SIZE, data.num_mines, newRevealed.length);

  await supabase
    .from("mines_games")
    .update({ revealed: newRevealed, multiplier })
    .eq("id", gameId);

  revalidatePath("/gambling");

  return {
    game: {
      id: gameId,
      wager: data.wager,
      num_mines: data.num_mines,
      revealed: newRevealed,
      multiplier,
      nextMultiplier,
      status: "active",
      payout: 0,
    },
  };
}

export async function cashOut(
  gameId: string
): Promise<{ error?: string; game?: MinesGameState }> {
  const supabase = await createClient();
  const playerId = await getCurrentPlayerId(supabase);
  if (!playerId) return { error: "No s'ha pogut identificar l'usuari." };

  const { data } = await supabase
    .from("mines_games")
    .select("*")
    .eq("id", gameId)
    .eq("player_id", playerId)
    .eq("status", "active")
    .single();

  if (!data) return { error: "Partida no trobada o ja finalitzada." };

  const revealed = (data.revealed as number[]) ?? [];
  if (revealed.length === 0) return { error: "Has de revelar almenys una casella." };

  const minePositions = data.mine_positions as number[];
  const multiplier = calculateMultiplier(GRID_SIZE, data.num_mines, revealed.length);
  const payout = Math.floor(data.wager * multiplier);

  await supabase
    .from("mines_games")
    .update({
      status: "cashed_out",
      payout,
      multiplier,
    })
    .eq("id", gameId);

  revalidatePath("/gambling");

  return {
    game: {
      id: gameId,
      wager: data.wager,
      num_mines: data.num_mines,
      revealed,
      multiplier,
      nextMultiplier: 0,
      status: "cashed_out",
      payout,
      minePositions,
    },
  };
}
