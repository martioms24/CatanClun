"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendPushToAll } from "@/lib/push/send";
import type { Bet, PlayerPoints, Player } from "@/types";

// ── Point constants ──────────────────────────────────────────
const POINTS_GAME_PLAYED = 5;
const POINTS_GAME_WON = 20;
const POINTS_QUEDADA_ATTENDED = 5;
const POINTS_STARTING_BONUS = 100;

// ── Helpers ──────────────────────────────────────────────────

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

async function getCurrentPlayerName(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("players")
    .select("name")
    .eq("user_id", user.id)
    .single();
  return data?.name ?? null;
}

// ── Points calculation ───────────────────────────────────────

export async function getPlayerPointsAll(): Promise<PlayerPoints[]> {
  const supabase = await createClient();

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .order("name");
  if (!players) return [];

  // Games played & won per player
  const { data: results } = await supabase
    .from("game_results")
    .select("player_id, position");

  // Quedadas confirmed per player
  const { data: participations } = await supabase
    .from("quedada_participants")
    .select("player_id, status, quedadas(date)")
    .eq("status", "confirmed");

  // Wagers and payouts per player
  const { data: wagers } = await supabase
    .from("bet_wagers")
    .select("player_id, amount, payout");

  const today = new Date().toISOString().slice(0, 10);

  return players.map((player: Player) => {
    // Earned from games
    const playerResults = results?.filter((r) => r.player_id === player.id) ?? [];
    const gamesPlayed = playerResults.length;
    const gamesWon = playerResults.filter((r) => r.position === 1).length;
    const gamePoints = gamesPlayed * POINTS_GAME_PLAYED + gamesWon * POINTS_GAME_WON;

    // Earned from quedadas (only past ones)
    const playerQuedadas = participations?.filter((p) => {
      if (p.player_id !== player.id) return false;
      const q = p.quedadas as unknown as { date: string };
      return q.date <= today;
    }) ?? [];
    const quedadaPoints = playerQuedadas.length * POINTS_QUEDADA_ATTENDED;

    const earned = POINTS_STARTING_BONUS + gamePoints + quedadaPoints;

    // Gambling
    const playerWagers = wagers?.filter((w) => w.player_id === player.id) ?? [];
    const wagered = playerWagers.reduce((sum, w) => sum + w.amount, 0);
    const won = playerWagers.reduce((sum, w) => sum + w.payout, 0);

    return {
      player,
      earned,
      wagered,
      won,
      balance: earned - wagered + won,
    };
  });
}

export async function getPlayerBalance(playerId: string): Promise<number> {
  const all = await getPlayerPointsAll();
  return all.find((p) => p.player.id === playerId)?.balance ?? 0;
}

// ── Bets CRUD ────────────────────────────────────────────────

export async function getBets(): Promise<Bet[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bets")
    .select(
      `*, creator:players!bets_created_by_fkey(*), options:bet_options(*), wagers:bet_wagers(*, player:players(*))`
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Bet[]) ?? [];
}

export async function createBet(
  title: string,
  options: string[]
) {
  const trimmed = title.trim();
  if (!trimmed) return { error: "El títol no pot estar buit." };
  if (options.length < 2) return { error: "Cal almenys 2 opcions." };

  const validOptions = options.map((o) => o.trim()).filter(Boolean);
  if (validOptions.length < 2) return { error: "Cal almenys 2 opcions vàlides." };

  const supabase = await createClient();
  const creatorId = await getCurrentPlayerId(supabase);
  if (!creatorId) return { error: "No s'ha pogut identificar l'usuari." };

  const { data: bet, error } = await supabase
    .from("bets")
    .insert({ title: trimmed, created_by: creatorId })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const { error: optError } = await supabase.from("bet_options").insert(
    validOptions.map((label) => ({ bet_id: bet.id, label }))
  );

  if (optError) return { error: optError.message };

  const creatorName = await getCurrentPlayerName(supabase);
  await sendPushToAll({
    title: "Nova aposta!",
    body: `${creatorName ?? "Algú"}: ${trimmed}`,
    url: "/gambling",
    tag: "gambling",
  });

  revalidatePath("/gambling");
  revalidatePath("/forum");
  return { error: null, id: bet.id };
}

export async function placeBet(
  betId: string,
  optionId: string,
  amount: number
) {
  if (amount <= 0) return { error: "L'aposta ha de ser positiva." };

  const supabase = await createClient();
  const playerId = await getCurrentPlayerId(supabase);
  if (!playerId) return { error: "No s'ha pogut identificar l'usuari." };

  // Check balance
  const balance = await getPlayerBalance(playerId);
  if (amount > balance) return { error: `No tens prou punts. Saldo: ${balance}` };

  // Check bet is open
  const { data: bet } = await supabase
    .from("bets")
    .select("status")
    .eq("id", betId)
    .single();
  if (!bet || bet.status !== "open")
    return { error: "Aquesta aposta ja no està oberta." };

  // Check if already wagered on this option
  const { data: existing } = await supabase
    .from("bet_wagers")
    .select("id")
    .eq("bet_id", betId)
    .eq("option_id", optionId)
    .eq("player_id", playerId)
    .maybeSingle();

  if (existing) return { error: "Ja has apostat a aquesta opció." };

  const { error } = await supabase.from("bet_wagers").insert({
    bet_id: betId,
    option_id: optionId,
    player_id: playerId,
    amount,
  });

  if (error) return { error: error.message };

  revalidatePath("/gambling");
  revalidatePath("/forum");
  return { error: null };
}

export async function closeBet(betId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bets")
    .update({ status: "closed" })
    .eq("id", betId);

  if (error) return { error: error.message };
  revalidatePath("/gambling");
  return { error: null };
}

export async function resolveBet(betId: string, winningOptionId: string) {
  const supabase = await createClient();
  const playerId = await getCurrentPlayerId(supabase);
  if (!playerId) return { error: "No s'ha pogut identificar l'usuari." };

  // Verify creator
  const { data: bet } = await supabase
    .from("bets")
    .select("created_by, status")
    .eq("id", betId)
    .single();

  if (!bet) return { error: "Aposta no trobada." };
  if (bet.created_by !== playerId)
    return { error: "Només el creador pot resoldre l'aposta." };
  if (bet.status === "resolved")
    return { error: "L'aposta ja està resolta." };

  // Get number of options for multiplier
  const { data: options } = await supabase
    .from("bet_options")
    .select("id")
    .eq("bet_id", betId);

  const numOptions = options?.length ?? 2;

  // Get all wagers for this bet
  const { data: wagers } = await supabase
    .from("bet_wagers")
    .select("id, option_id, amount")
    .eq("bet_id", betId);

  // Calculate payouts for winners
  if (wagers) {
    for (const w of wagers) {
      const payout = w.option_id === winningOptionId ? w.amount * numOptions : 0;
      await supabase
        .from("bet_wagers")
        .update({ payout })
        .eq("id", w.id);
    }
  }

  // Mark bet as resolved
  const { error } = await supabase
    .from("bets")
    .update({
      status: "resolved",
      winning_option_id: winningOptionId,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", betId);

  if (error) return { error: error.message };

  // Get winning option label
  const { data: winOpt } = await supabase
    .from("bet_options")
    .select("label")
    .eq("id", winningOptionId)
    .single();

  const { data: betInfo } = await supabase
    .from("bets")
    .select("title")
    .eq("id", betId)
    .single();

  await sendPushToAll({
    title: "Aposta resolta!",
    body: `${betInfo?.title ?? "Aposta"}: guanya "${winOpt?.label ?? "?"}"`,
    url: "/gambling",
    tag: `bet-${betId}`,
  });

  revalidatePath("/gambling");
  revalidatePath("/forum");
  return { error: null };
}

export async function deleteBet(betId: string) {
  const supabase = await createClient();
  const playerId = await getCurrentPlayerId(supabase);
  if (!playerId) return { error: "No s'ha pogut identificar l'usuari." };

  const { data: bet } = await supabase
    .from("bets")
    .select("created_by, status")
    .eq("id", betId)
    .single();

  if (!bet) return { error: "Aposta no trobada." };
  if (bet.created_by !== playerId)
    return { error: "Només el creador pot eliminar l'aposta." };
  if (bet.status === "resolved")
    return { error: "No es pot eliminar una aposta resolta." };

  const { error } = await supabase.from("bets").delete().eq("id", betId);
  if (error) return { error: error.message };

  revalidatePath("/gambling");
  revalidatePath("/forum");
  return { error: null };
}
