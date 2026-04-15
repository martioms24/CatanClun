import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { MeepleIcon } from "@/components/ui/MeepleIcon";
import type { PlayerStats } from "@/types";
import { Trophy, Zap, Star, TrendingUp } from "lucide-react";

interface LeaderboardProps {
  stats: PlayerStats[];
  sortBy?: "wins" | "win_rate" | "avg_score";
}

const positionBadge = (i: number) => {
  if (i === 0) return "👑";
  if (i === 1) return "🥈";
  if (i === 2) return "🥉";
  return `${i + 1}.`;
};

export function Leaderboard({ stats, sortBy = "wins" }: LeaderboardProps) {
  const sorted = [...stats].sort((a, b) => {
    if (sortBy === "wins") return b.wins - a.wins || b.win_rate - a.win_rate;
    if (sortBy === "win_rate")
      return b.win_rate - a.win_rate || b.wins - a.wins;
    return b.avg_score - a.avg_score;
  });

  return (
    <Card>
      <CardHeader>
        <Trophy size={18} className="text-medieval-gold" />
        <CardTitle>Classificació</CardTitle>
      </CardHeader>
      <div className="flex flex-col gap-2">
        {sorted.map((s, i) => (
          <Link
            key={s.player.id}
            href={`/players/${s.player.id}`}
            className="flex items-center gap-3 px-2 py-2.5 rounded-medieval hover:bg-medieval-gold/10 transition-colors group"
          >
            <span className="w-7 text-center text-lg shrink-0">
              {positionBadge(i)}
            </span>
            <MeepleIcon color={s.player.color} size={26} />
            <span className="font-cinzel font-semibold text-medieval-dark flex-1 group-hover:text-medieval-gold transition-colors">
              {s.player.name}
            </span>
            <div className="flex items-center gap-4 text-right">
              <div className="hidden sm:block text-center">
                <p className="font-cinzel font-bold text-medieval-dark text-sm">
                  {s.wins}
                </p>
                <p className="text-medieval-stone text-xs font-garamond">victòries</p>
              </div>
              <div className="hidden sm:block text-center">
                <p className="font-cinzel font-bold text-medieval-dark text-sm">
                  {s.win_rate}%
                </p>
                <p className="text-medieval-stone text-xs font-garamond">taxa</p>
              </div>
              <div className="text-center">
                <p className="font-cinzel font-bold text-medieval-dark text-sm">
                  {s.avg_score > 0 ? s.avg_score.toFixed(0) : "—"}
                </p>
                <p className="text-medieval-stone text-xs font-garamond">mitja</p>
              </div>
              <div className="text-center">
                <p className="font-cinzel font-bold text-medieval-dark text-sm">
                  {s.games_played}
                </p>
                <p className="text-medieval-stone text-xs font-garamond">partides</p>
              </div>
            </div>
          </Link>
        ))}
        {sorted.length === 0 && (
          <div className="text-center py-8 text-medieval-stone font-garamond">
            <Trophy size={32} className="mx-auto mb-2 opacity-30" />
            <p>Cap partida registrada.</p>
            <p className="text-sm">
              <Link href="/games/new" className="text-medieval-gold underline">
                Registra la primera partida!
              </Link>
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

export function StatsCards({ stats }: { stats: PlayerStats[] }) {
  const topWins = [...stats].sort((a, b) => b.wins - a.wins)[0];
  const topAvg = [...stats].sort((a, b) => b.avg_score - a.avg_score)[0];
  const topStreak = [...stats].sort(
    (a, b) => b.longest_streak - a.longest_streak
  )[0];
  const topScore = [...stats].sort((a, b) => b.best_score - a.best_score)[0];

  const cards = [
    {
      icon: "👑",
      label: "Més Victòries",
      player: topWins,
      value: topWins ? `${topWins.wins} victòries` : "—",
    },
    {
      icon: "⚡",
      label: "Ratxa Més Llarga",
      player: topStreak,
      value: topStreak?.longest_streak
        ? `${topStreak.longest_streak} consecutives`
        : "—",
    },
    {
      icon: "🎯",
      label: "Millor Mitja",
      player: topAvg,
      value: topAvg?.avg_score ? `${topAvg.avg_score.toFixed(0)} pts` : "—",
    },
    {
      icon: "🏆",
      label: "Màxim Historial",
      player: topScore,
      value: topScore?.best_score ? `${topScore.best_score} pts` : "—",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((c) => (
        <Card key={c.label} variant="gold" className="p-3">
          <div className="text-2xl mb-1">{c.icon}</div>
          <p className="font-cinzel text-xs text-medieval-stone mb-0.5">
            {c.label}
          </p>
          {c.player && (
            <div className="flex items-center gap-1.5 mb-0.5">
              <MeepleIcon color={c.player.player.color} size={14} />
              <span className="font-cinzel font-bold text-medieval-dark text-sm">
                {c.player.player.name}
              </span>
            </div>
          )}
          <p className="font-garamond text-medieval-brown text-sm">{c.value}</p>
        </Card>
      ))}
    </div>
  );
}
