"use server";

import { createClient } from "@/lib/supabase/server";
import {
  AVAILABLE_YEARS,
  getAwardsForYear,
  PLAYER_AWARD_NAMES,
} from "@/lib/awards-data";
import type { AwardWin, QuedadaStats, Player } from "@/types";

export async function getPlayerAwardWins(
  playerName: string
): Promise<AwardWin[]> {
  const awardNames = PLAYER_AWARD_NAMES[playerName];
  if (!awardNames) return [];

  const wins: AwardWin[] = [];

  for (const year of AVAILABLE_YEARS) {
    const data = getAwardsForYear(year);
    if (!data || data.comingSoon) continue;

    for (const cat of data.categories) {
      const winner = cat.results[0]; // first = most votes = winner
      if (winner && awardNames.includes(winner.name)) {
        wins.push({ year, category: cat.title, emoji: cat.emoji });
      }
    }
  }

  return wins;
}

export async function getPlayerQuedadaStats(
  playerId: string
): Promise<QuedadaStats> {
  const supabase = await createClient();

  // Get all participations for this player
  const { data: participations } = await supabase
    .from("quedada_participants")
    .select("status, quedada_id, quedadas(date, status)")
    .eq("player_id", playerId);

  if (!participations || participations.length === 0) {
    return {
      total_attended: 0,
      total_invited: 0,
      upcoming: 0,
      frequent_partners: [],
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  let total_attended = 0;
  let total_invited = participations.length;
  let upcoming = 0;
  const confirmedQuedadaIds: string[] = [];

  for (const p of participations) {
    const q = p.quedadas as unknown as { date: string; status: string };
    if (p.status === "confirmed") {
      if (q.date <= today) {
        total_attended++;
      }
      confirmedQuedadaIds.push(p.quedada_id);
    }
    if (q.date > today && p.status !== "rejected") {
      upcoming++;
    }
  }

  // Find frequent partners from confirmed quedadas
  const partnerCounts: Record<string, number> = {};
  if (confirmedQuedadaIds.length > 0) {
    const { data: coParticipants } = await supabase
      .from("quedada_participants")
      .select("player_id")
      .in("quedada_id", confirmedQuedadaIds)
      .eq("status", "confirmed")
      .neq("player_id", playerId);

    if (coParticipants) {
      for (const cp of coParticipants) {
        partnerCounts[cp.player_id] = (partnerCounts[cp.player_id] || 0) + 1;
      }
    }
  }

  // Get player details for top partners
  const sortedPartners = Object.entries(partnerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  let frequent_partners: { player: Player; count: number }[] = [];
  if (sortedPartners.length > 0) {
    const { data: players } = await supabase
      .from("players")
      .select("*")
      .in(
        "id",
        sortedPartners.map(([id]) => id)
      );

    if (players) {
      frequent_partners = sortedPartners
        .map(([id, count]) => {
          const player = players.find((p) => p.id === id);
          return player ? { player, count } : null;
        })
        .filter(Boolean) as { player: Player; count: number }[];
    }
  }

  return { total_attended, total_invited, upcoming, frequent_partners };
}

export async function getPlayerPlanStats(
): Promise<{ done: number; total: number }> {
  const supabase = await createClient();
  const { data } = await supabase.from("plans").select("status");
  if (!data) return { done: 0, total: 0 };
  return {
    done: data.filter((p) => p.status === "done").length,
    total: data.length,
  };
}
