import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPlayerStatById,
  getExtensionWinRates,
  getGames,
} from "@/app/actions/game-actions";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { MeepleAvatar } from "@/components/ui/MeepleIcon";
import { GameCard } from "@/components/game/GameCard";
import { ScoreChart } from "./ScoreChart";
import { Trophy, Target, Zap, Star, Puzzle, Swords, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [stats, extRates, games] = await Promise.all([
    getPlayerStatById(id),
    getExtensionWinRates(id),
    getGames(),
  ]);

  if (!stats) notFound();

  const playerGames = games
    .filter((g) => g.results?.some((r) => r.player_id === id))
    .slice(0, 10);

  const scoreHistory = playerGames
    .map((g) => {
      const result = g.results?.find((r) => r.player_id === id);
      return {
        date: g.played_at,
        score: result?.score ?? null,
        position: result?.position ?? 0,
      };
    })
    .filter((d) => d.score !== null)
    .reverse() as { date: string; score: number; position: number }[];

  const statItems = [
    { icon: Trophy, label: "Victòries", value: stats.wins, color: "text-medieval-gold" },
    { icon: Target, label: "Taxa de Victòries", value: `${stats.win_rate}%`, color: "text-medieval-green" },
    { icon: Star, label: "Puntuació Mitja", value: stats.avg_score > 0 ? stats.avg_score.toFixed(0) : "—", color: "text-medieval-blue" },
    { icon: Star, label: "Millor Puntuació", value: stats.best_score || "—", color: "text-medieval-gold" },
    { icon: Zap, label: "Ratxa Actual", value: stats.current_streak > 0 ? `${stats.current_streak}🔥` : "—", color: "text-medieval-burgundy" },
    { icon: Zap, label: "Millor Ratxa", value: stats.longest_streak || "—", color: "text-medieval-stone" },
    { icon: Swords, label: "Partides Jugades", value: stats.games_played, color: "text-medieval-dark" },
    { icon: TrendingUp, label: "Pòdiums (Top 3)", value: stats.podium_count, color: "text-amber-600" },
  ];

  return (
    <div className="page-container max-w-2xl">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-8">
        <MeepleAvatar
          name={stats.player.name}
          color={stats.player.color}
          size="lg"
        />
        <div className="text-center sm:text-left">
          <h1 className="page-title mb-1">{stats.player.name}</h1>
          <p className="font-garamond text-medieval-stone text-base">
            {stats.games_played === 0
              ? "Cap partida registrada"
              : `${stats.games_played} ${stats.games_played === 1 ? "batalla disputada" : "batalles disputades"}`}
          </p>
          {stats.current_streak > 1 && (
            <p className="font-cinzel text-medieval-gold font-semibold text-sm mt-1">
              🔥 En ratxa de {stats.current_streak} victòries consecutives!
            </p>
          )}
        </div>
      </div>

      <Card className="mb-5">
        <CardHeader>
          <Trophy size={16} className="text-medieval-gold" />
          <CardTitle>Estadístiques</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statItems.map((s) => (
            <div key={s.label} className="text-center">
              <s.icon size={18} className={`mx-auto mb-1 ${s.color}`} />
              <p className={`font-cinzel font-bold text-lg ${s.color}`}>
                {s.value}
              </p>
              <p className="font-garamond text-medieval-stone text-xs">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {scoreHistory.length >= 2 && (
        <Card className="mb-5">
          <CardHeader>
            <TrendingUp size={16} className="text-medieval-gold" />
            <CardTitle>Historial de Puntuació</CardTitle>
          </CardHeader>
          <ScoreChart data={scoreHistory} playerColor={stats.player.color} />
        </Card>
      )}

      {extRates.length > 0 && (
        <Card className="mb-5">
          <CardHeader>
            <Puzzle size={16} className="text-medieval-gold" />
            <CardTitle>Taxa de Victòries per Extensió</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-2">
            {extRates
              .sort((a, b) => b.win_rate - a.win_rate)
              .map((e) => (
                <div key={e.extension.id} className="flex items-center gap-3">
                  <span className="font-garamond text-medieval-dark text-sm flex-1 truncate">
                    {e.extension.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-medieval-brown/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-medieval-gold transition-all"
                        style={{ width: `${e.win_rate}%` }}
                      />
                    </div>
                    <span className="font-cinzel text-xs text-medieval-dark w-10 text-right">
                      {e.win_rate}%
                    </span>
                    <span className="font-garamond text-medieval-stone text-xs w-16 text-right">
                      {e.wins}/{e.games_played} partides
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {playerGames.length > 0 && (
        <div>
          <div className="divider-ornament">
            <span className="font-cinzel text-sm text-medieval-gold/60 px-2">
              Batalles Recents
            </span>
          </div>
          <div className="flex flex-col gap-3 mt-4">
            {playerGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <Link
          href="/dashboard"
          className="font-cinzel text-medieval-stone text-sm hover:text-medieval-gold transition-colors"
        >
          ← Tornar al Tauler
        </Link>
      </div>
    </div>
  );
}
