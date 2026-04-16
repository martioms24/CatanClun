"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActivityItem } from "@/types";

export async function getRecentActivity(
  limit = 30
): Promise<ActivityItem[]> {
  const supabase = await createClient();
  const items: ActivityItem[] = [];

  // Recent games
  const { data: games } = await supabase
    .from("games")
    .select("id, played_at, notes, results:game_results(position, player:players(name))")
    .order("played_at", { ascending: false })
    .limit(limit);

  if (games) {
    for (const g of games) {
      const results = g.results as unknown as {
        position: number;
        player: { name: string };
      }[];
      const winner = results?.find((r) => r.position === 1);
      const playerCount = results?.length ?? 0;
      items.push({
        type: "game",
        date: g.played_at,
        title: `Partida de Carcassonne`,
        description: winner
          ? `${winner.player.name} ha guanyat${playerCount > 1 ? ` contra ${playerCount - 1} rivals` : ""}` +
            (g.notes ? ` — ${g.notes}` : "")
          : g.notes ?? undefined,
        link: `/games/${g.id}`,
      });
    }
  }

  // Recent quedadas
  const { data: quedadas } = await supabase
    .from("quedadas")
    .select("id, date, description, status, creator:players!quedadas_created_by_fkey(name)")
    .order("date", { ascending: false })
    .limit(limit);

  if (quedadas) {
    for (const q of quedadas) {
      const creator = q.creator as unknown as { name: string };
      const statusLabel =
        q.status === "confirmed"
          ? "confirmada"
          : q.status === "rejected"
          ? "rebutjada"
          : "pendent";
      items.push({
        type: "quedada",
        date: q.date,
        title: `Quedada ${statusLabel}`,
        description:
          `Proposada per ${creator?.name ?? "Desconegut"}` +
          (q.description ? ` — ${q.description}` : ""),
        link: "/plans/quedades",
      });
    }
  }

  // Recent plans resolved
  const { data: plans } = await supabase
    .from("plans")
    .select("id, title, status, resolved_at, created_at")
    .in("status", ["done", "discarded"])
    .order("resolved_at", { ascending: false })
    .limit(limit);

  if (plans) {
    for (const p of plans) {
      items.push({
        type: "plan",
        date: (p.resolved_at ?? p.created_at).slice(0, 10),
        title:
          p.status === "done"
            ? `Pla completat: ${p.title}`
            : `Pla descartat: ${p.title}`,
        link: "/plans/llista",
      });
    }
  }

  // Recent bets
  try {
    const { data: bets } = await supabase
      .from("bets")
      .select("id, title, status, created_at, resolved_at, winning_option_id, creator:players!bets_created_by_fkey(name)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (bets) {
      for (const b of bets) {
        const creator = b.creator as unknown as { name: string };
        if (b.status === "resolved") {
          // Get winning option label
          let winLabel = "?";
          if (b.winning_option_id) {
            const { data: opt } = await supabase
              .from("bet_options")
              .select("label")
              .eq("id", b.winning_option_id)
              .single();
            if (opt) winLabel = opt.label;
          }
          items.push({
            type: "bet_resolved",
            date: (b.resolved_at ?? b.created_at).slice(0, 10),
            title: `Aposta resolta: ${b.title}`,
            description: `Resultat: ${winLabel}`,
            link: "/gambling",
          });
        }
        items.push({
          type: "bet_created",
          date: b.created_at.slice(0, 10),
          title: `Nova aposta: ${b.title}`,
          description: `Creada per ${creator?.name ?? "Desconegut"}`,
          link: "/gambling",
        });
      }
    }
  } catch {
    // bets table may not exist yet
  }

  // Sort by date descending
  items.sort((a, b) => b.date.localeCompare(a.date));

  return items.slice(0, limit);
}
