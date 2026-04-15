"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { NewGamePayload, Game, PlayerStats, Extension } from "@/types";

// ─── Read helpers ────────────────────────────────────────────

export async function getGames(): Promise<Game[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select(
      `
      *,
      results:game_results(*, player:players(*)),
      extensions:game_extensions(extension:extensions(*))
    `
    )
    .order("played_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((g) => ({
    ...g,
    extensions: g.extensions?.map((ge: { extension: Extension }) => ge.extension) ?? [],
  }));
}

export async function getGame(id: string): Promise<Game | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select(
      `
      *,
      results:game_results(*, player:players(*)),
      extensions:game_extensions(extension:extensions(*))
    `
    )
    .eq("id", id)
    .single();

  if (error) return null;

  return {
    ...data,
    extensions: data.extensions?.map((ge: { extension: Extension }) => ge.extension) ?? [],
  };
}

export async function getPlayers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getExtensions(): Promise<Extension[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("extensions")
    .select("*")
    .order("is_official", { ascending: false })
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ─── Mutations ───────────────────────────────────────────────

export async function createGame(payload: NewGamePayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: game, error: gameError } = await supabase
    .from("games")
    .insert({
      played_at: payload.played_at,
      notes: payload.notes ?? null,
      created_by: user?.id ?? null,
    })
    .select()
    .single();

  if (gameError) return { error: gameError.message };

  if (payload.results.length > 0) {
    const { error: resultsError } = await supabase.from("game_results").insert(
      payload.results.map((r) => ({ ...r, game_id: game.id }))
    );
    if (resultsError) return { error: resultsError.message };
  }

  if (payload.extension_ids.length > 0) {
    const { error: extError } = await supabase
      .from("game_extensions")
      .insert(
        payload.extension_ids.map((eid) => ({
          game_id: game.id,
          extension_id: eid,
        }))
      );
    if (extError) return { error: extError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/games");
  return { success: true, id: game.id };
}

export async function updateGame(id: string, payload: NewGamePayload) {
  const supabase = await createClient();

  const { error: gameError } = await supabase
    .from("games")
    .update({ played_at: payload.played_at, notes: payload.notes ?? null })
    .eq("id", id);

  if (gameError) return { error: gameError.message };

  await supabase.from("game_results").delete().eq("game_id", id);
  if (payload.results.length > 0) {
    const { error: resultsError } = await supabase.from("game_results").insert(
      payload.results.map((r) => ({ ...r, game_id: id }))
    );
    if (resultsError) return { error: resultsError.message };
  }

  await supabase.from("game_extensions").delete().eq("game_id", id);
  if (payload.extension_ids.length > 0) {
    const { error: extError } = await supabase
      .from("game_extensions")
      .insert(
        payload.extension_ids.map((eid) => ({
          game_id: id,
          extension_id: eid,
        }))
      );
    if (extError) return { error: extError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/games");
  revalidatePath(`/games/${id}`);
  return { success: true };
}

export async function deleteGame(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("games").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/games");
  return { success: true };
}

export async function createCustomExtension(name: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("extensions")
    .insert({ name: name.trim(), is_official: false })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath("/games/new");
  return { success: true, extension: data };
}

// ─── Stats ────────────────────────────────────────────────────

export async function getPlayerStats(): Promise<PlayerStats[]> {
  const supabase = await createClient();

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("*")
    .order("name");

  if (playersError) throw new Error(playersError.message);

  const { data: results, error: resultsError } = await supabase
    .from("game_results")
    .select("*, game:games(played_at)")
    .order("game_id");

  if (resultsError) throw new Error(resultsError.message);

  return (players ?? []).map((player) => {
    const playerResults = (results ?? []).filter(
      (r) => r.player_id === player.id
    );

    const gamesPlayed = playerResults.length;
    const wins = playerResults.filter((r) => r.position === 1).length;
    const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;

    // Only use non-null scores for avg/best calculations
    const scoredResults = playerResults.filter(
      (r) => r.score !== null && r.score !== undefined
    );
    const avgScore =
      scoredResults.length > 0
        ? scoredResults.reduce((acc, r) => acc + (r.score as number), 0) /
          scoredResults.length
        : 0;
    const bestResult =
      scoredResults.length > 0
        ? scoredResults.reduce(
            (best, r) =>
              (r.score as number) > ((best?.score as number) ?? -1) ? r : best,
            null as (typeof results)[0] | null
          )
        : null;

    const totalScore = playerResults.reduce(
      (acc, r) => acc + (r.score ?? 0),
      0
    );
    const podiumCount = playerResults.filter((r) => r.position <= 3).length;

    // Streaks: sort by played_at
    const sortedResults = [...playerResults].sort((a, b) =>
      (a.game?.played_at ?? "").localeCompare(b.game?.played_at ?? "")
    );

    let longestStreak = 0;
    let tempStreak = 0;
    for (const r of sortedResults) {
      if (r.position === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    let currentStreak = 0;
    for (let i = sortedResults.length - 1; i >= 0; i--) {
      if (sortedResults[i].position === 1) currentStreak++;
      else break;
    }

    return {
      player,
      games_played: gamesPlayed,
      wins,
      win_rate: Math.round(winRate * 10) / 10,
      avg_score: Math.round(avgScore * 10) / 10,
      best_score: (bestResult?.score as number) ?? 0,
      best_score_game_id: bestResult?.game_id ?? null,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      total_score: totalScore,
      podium_count: podiumCount,
    };
  });
}

export async function getPlayerStatById(
  playerId: string
): Promise<PlayerStats | null> {
  const stats = await getPlayerStats();
  return stats.find((s) => s.player.id === playerId) ?? null;
}

export async function getExtensionWinRates(playerId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("game_results")
    .select(
      `
      position,
      game:games(
        id,
        game_extensions(extension:extensions(*))
      )
    `
    )
    .eq("player_id", playerId);

  if (error) throw new Error(error.message);

  const extMap = new Map<
    string,
    { extension: Extension; games: number; wins: number }
  >();

  for (const result of data ?? []) {
    const gameExts =
      (
        result.game as unknown as {
          game_extensions: { extension: Extension }[];
        }
      )?.game_extensions ?? [];

    for (const ge of gameExts) {
      const ext = ge.extension;
      const existing = extMap.get(ext.id) ?? {
        extension: ext,
        games: 0,
        wins: 0,
      };
      existing.games++;
      if (result.position === 1) existing.wins++;
      extMap.set(ext.id, existing);
    }
  }

  return Array.from(extMap.values()).map((e) => ({
    extension: e.extension,
    games_played: e.games,
    wins: e.wins,
    win_rate:
      e.games > 0 ? Math.round((e.wins / e.games) * 1000) / 10 : 0,
  }));
}
