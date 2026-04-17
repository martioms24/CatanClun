"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendPushToAll } from "@/lib/push/send";
import { PEAKS_100_CIMS } from "@/lib/peaks-100cims";
import type { Bet, PlayerPoints, Player } from "@/types";

// ── Point constants ──────────────────────────────────────────
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

// ── Game position scoring ───────────────────────────────────
function getGamePositionPoints(position: number): number {
  if (position === 1) return 8;
  if (position === 2) return 5;
  if (position === 3) return 3;
  return 1;
}

// ── Cims point calculation (base + altitude, excludes auto-quedada) ──
function getCimPoints(peakName: string): number {
  const peak = PEAKS_100_CIMS.find((p) => p.name === peakName);
  if (!peak) return 0;
  const base = peak.essential ? 8 : 6;
  let bonus = 0;
  if (peak.altitude >= 3000) bonus = 20;
  else if (peak.altitude >= 2750) bonus = 14;
  else if (peak.altitude >= 2500) bonus = 12;
  else if (peak.altitude >= 2250) bonus = 10;
  else if (peak.altitude >= 2000) bonus = 8;
  else if (peak.altitude >= 1750) bonus = 6;
  else if (peak.altitude >= 1500) bonus = 4;
  else if (peak.altitude >= 1000) bonus = 2;
  return base + bonus;
}

// ── Points calculation ───────────────────────────────────────

export async function getPlayerPointsAll(): Promise<PlayerPoints[]> {
  const supabase = await createClient();

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .order("name");
  if (!players) return [];

  // Games: position-based scoring
  const { data: results } = await supabase
    .from("game_results")
    .select("player_id, position");

  // Quedadas: points come from the quedada row itself
  const { data: participations } = await supabase
    .from("quedada_participants")
    .select("player_id, quedadas(date, points)")
    .eq("status", "confirmed");

  // Wagers and payouts per player
  const { data: wagers } = await supabase
    .from("bet_wagers")
    .select("player_id, amount, payout");

  // Redemptions per player
  const { data: redemptions } = await supabase
    .from("redemptions")
    .select("redeemed_by, cost");

  // Peak completions per player (cim-specific points, not the auto-quedada)
  let cimsPlayerPoints: { player_id: string; peak_name: string }[] = [];
  try {
    const { data: compPlayers } = await supabase
      .from("peak_completion_players")
      .select("player_id, completion:peak_completions(peak_name)");
    cimsPlayerPoints = (compPlayers ?? []).map((cp) => ({
      player_id: cp.player_id,
      peak_name: (cp.completion as unknown as { peak_name: string }).peak_name,
    }));
  } catch {
    // Table may not exist yet
  }

  // Plan completions
  let planPlayerPoints: { player_id: string; points: number }[] = [];
  try {
    const { data: planComps } = await supabase
      .from("plan_completions")
      .select("player_id, plan:plans(points)");
    planPlayerPoints = (planComps ?? []).map((pc) => ({
      player_id: pc.player_id,
      points: (pc.plan as unknown as { points: number })?.points ?? 10,
    }));
  } catch {
    // Table may not exist yet
  }

  const today = new Date().toISOString().slice(0, 10);

  return players.map((player: Player) => {
    // Earned from game positions (1st=8, 2nd=5, 3rd=3, 4th+=1)
    const playerResults = results?.filter((r) => r.player_id === player.id) ?? [];
    const gamePoints = playerResults.reduce(
      (sum, r) => sum + getGamePositionPoints(r.position),
      0
    );

    // Earned from quedadas (use the points field from each quedada)
    const playerQuedadas = participations?.filter((p) => {
      if (p.player_id !== player.id) return false;
      const q = p.quedadas as unknown as { date: string; points: number };
      return q.date <= today;
    }) ?? [];
    const quedadaPoints = playerQuedadas.reduce((sum, p) => {
      const q = p.quedadas as unknown as { points: number };
      return sum + (q.points ?? 4);
    }, 0);

    // Earned from cims (base + altitude bonus, per unique peak)
    const playerCims = cimsPlayerPoints.filter((c) => c.player_id === player.id);
    const uniquePeaks = new Set(playerCims.map((c) => c.peak_name));
    const cimsPoints = [...uniquePeaks].reduce((sum, name) => sum + getCimPoints(name), 0);

    // Earned from completed plans
    const playerPlanPoints = planPlayerPoints
      .filter((p) => p.player_id === player.id)
      .reduce((sum, p) => sum + p.points, 0);

    const earned = POINTS_STARTING_BONUS + gamePoints + quedadaPoints + cimsPoints + playerPlanPoints;

    // Gambling
    const playerWagers = wagers?.filter((w) => w.player_id === player.id) ?? [];
    const wagered = playerWagers.reduce((sum, w) => sum + w.amount, 0);
    const won = playerWagers.reduce((sum, w) => sum + w.payout, 0);

    // Redemptions
    const playerRedemptions = redemptions?.filter((r) => r.redeemed_by === player.id) ?? [];
    const redeemed = playerRedemptions.reduce((sum, r) => sum + r.cost, 0);

    return {
      player,
      earned,
      wagered,
      won,
      balance: earned - wagered + won - redeemed,
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

  if (error) {
    console.error("[gambling] getBets error:", error.message);
    return [];
  }
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
