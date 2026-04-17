"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PeakCompletion } from "@/types";

export async function getPeakCompletions(): Promise<PeakCompletion[]> {
  const supabase = await createClient();
  const { data: completions, error } = await supabase
    .from("peak_completions")
    .select("*")
    .order("completed_at", { ascending: false });

  if (error) {
    console.error("[cims] getPeakCompletions error:", error.message);
    return [];
  }

  // Get all completion-player relationships with player info
  const { data: compPlayers } = await supabase
    .from("peak_completion_players")
    .select("completion_id, player:players(*)");

  return (completions ?? []).map((c) => ({
    ...c,
    players:
      compPlayers
        ?.filter((cp) => cp.completion_id === c.id)
        .map((cp) => cp.player as unknown as PeakCompletion["players"] extends (infer T)[] | undefined ? T : never)
        .filter(Boolean) ?? [],
  })) as PeakCompletion[];
}

export async function completePeak(
  peakName: string,
  playerIds: string[],
  completedAt: string
) {
  if (!peakName) return { error: "Cal un cim." };
  if (playerIds.length === 0) return { error: "Cal almenys un jugador." };

  const supabase = await createClient();

  // Insert completion
  const { data: completion, error } = await supabase
    .from("peak_completions")
    .insert({ peak_name: peakName, completed_at: completedAt })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Insert players
  const { error: playersError } = await supabase
    .from("peak_completion_players")
    .insert(
      playerIds.map((pid) => ({
        completion_id: completion.id,
        player_id: pid,
      }))
    );

  if (playersError) return { error: playersError.message };

  revalidatePath("/cims");
  return { error: null };
}

export async function deletePeakCompletion(completionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("peak_completions")
    .delete()
    .eq("id", completionId);

  if (error) return { error: error.message };

  revalidatePath("/cims");
  return { error: null };
}
