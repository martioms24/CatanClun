import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPlayerStatById,
  getExtensionWinRates,
  getGames,
} from "@/app/actions/game-actions";
import {
  getPlayerAwardWins,
  getPlayerQuedadaStats,
  getPlayerPlanStats,
} from "@/app/actions/profile-actions";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { MeepleAvatar, MeepleIcon } from "@/components/ui/MeepleIcon";
import { GameCard } from "@/components/game/GameCard";
import { ScoreChart } from "./ScoreChart";
import {
  Trophy,
  Target,
  Zap,
  Star,
  Puzzle,
  Swords,
  TrendingUp,
  Award,
  CalendarHeart,
  ListChecks,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [stats, extRates, games, awardWins, quedadaStats, planStats] =
    await Promise.all([
      getPlayerStatById(id),
      getExtensionWinRates(id),
      getGames(),
      getPlayerStatById(id).then((s) =>
        s ? getPlayerAwardWins(s.player.name) : []
      ),
      getPlayerQuedadaStats(id),
      getPlayerPlanStats(),
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
    {
      icon: Trophy,
      label: "Victories",
      value: stats.wins,
      color: "text-medieval-gold",
    },
    {
      icon: Target,
      label: "Taxa de Victories",
      value: `${stats.win_rate}%`,
      color: "text-medieval-green",
    },
    {
      icon: Star,
      label: "Puntuacio Mitja",
      value: stats.avg_score > 0 ? stats.avg_score.toFixed(0) : "\u2014",
      color: "text-medieval-blue",
    },
    {
      icon: Star,
      label: "Millor Puntuacio",
      value: stats.best_score || "\u2014",
      color: "text-medieval-gold",
    },
    {
      icon: Zap,
      label: "Ratxa Actual",
      value:
        stats.current_streak > 0 ? `${stats.current_streak}\uD83D\uDD25` : "\u2014",
      color: "text-medieval-burgundy",
    },
    {
      icon: Zap,
      label: "Millor Ratxa",
      value: stats.longest_streak || "\u2014",
      color: "text-medieval-stone",
    },
    {
      icon: Swords,
      label: "Partides Jugades",
      value: stats.games_played,
      color: "text-medieval-dark",
    },
    {
      icon: TrendingUp,
      label: "Podiums (Top 3)",
      value: stats.podium_count,
      color: "text-amber-600",
    },
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
              {"\uD83D\uDD25"} En ratxa de {stats.current_streak} victories consecutives!
            </p>
          )}
        </div>
      </div>

      {/* Activity overview */}
      <Card className="mb-5">
        <CardHeader>
          <ListChecks size={16} className="text-medieval-gold" />
          <CardTitle>Resum d&apos;Activitat</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center">
            <Swords size={18} className="mx-auto mb-1 text-medieval-brown" />
            <p className="font-cinzel font-bold text-lg text-medieval-dark">
              {stats.games_played}
            </p>
            <p className="font-garamond text-medieval-stone text-xs">
              Partides
            </p>
          </div>
          <div className="text-center">
            <Award size={18} className="mx-auto mb-1 text-medieval-gold" />
            <p className="font-cinzel font-bold text-lg text-medieval-gold">
              {awardWins.length}
            </p>
            <p className="font-garamond text-medieval-stone text-xs">
              Premis Guanyats
            </p>
          </div>
          <div className="text-center">
            <CalendarHeart
              size={18}
              className="mx-auto mb-1 text-medieval-green"
            />
            <p className="font-cinzel font-bold text-lg text-medieval-green">
              {quedadaStats.total_attended}
            </p>
            <p className="font-garamond text-medieval-stone text-xs">
              Quedades
            </p>
          </div>
          <div className="text-center">
            <ListChecks
              size={18}
              className="mx-auto mb-1 text-medieval-blue"
            />
            <p className="font-cinzel font-bold text-lg text-medieval-blue">
              {planStats.done}/{planStats.total}
            </p>
            <p className="font-garamond text-medieval-stone text-xs">
              Plans Fets
            </p>
          </div>
        </div>
      </Card>

      {/* Carcassonne stats */}
      <Card className="mb-5">
        <CardHeader>
          <Trophy size={16} className="text-medieval-gold" />
          <CardTitle>Carcassonne</CardTitle>
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

      {scoreHistory.length >= 1 && (
        <Card className="mb-5">
          <CardHeader>
            <TrendingUp size={16} className="text-medieval-gold" />
            <CardTitle>Historial de Puntuacio</CardTitle>
          </CardHeader>
          <ScoreChart data={scoreHistory} playerColor={stats.player.color} />
        </Card>
      )}

      {extRates.length > 0 && (
        <Card className="mb-5">
          <CardHeader>
            <Puzzle size={16} className="text-medieval-gold" />
            <CardTitle>Taxa de Victories per Extensio</CardTitle>
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

      {/* Awards wins */}
      {awardWins.length > 0 && (
        <Card className="mb-5">
          <CardHeader>
            <Award size={16} className="text-medieval-gold" />
            <CardTitle>Premis Guanyats</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-2">
            {awardWins.map((aw, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg">{aw.emoji}</span>
                <span className="font-garamond text-medieval-dark text-sm flex-1">
                  {aw.category}
                </span>
                <Link
                  href={`/awards/${aw.year}`}
                  className="font-cinzel text-xs text-medieval-gold hover:underline"
                >
                  {aw.year}
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quedada stats */}
      {quedadaStats.total_invited > 0 && (
        <Card className="mb-5">
          <CardHeader>
            <CalendarHeart size={16} className="text-medieval-gold" />
            <CardTitle>Quedades</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <p className="font-cinzel font-bold text-lg text-medieval-green">
                {quedadaStats.total_attended}
              </p>
              <p className="font-garamond text-medieval-stone text-xs">
                Assistides
              </p>
            </div>
            <div className="text-center">
              <p className="font-cinzel font-bold text-lg text-medieval-dark">
                {quedadaStats.total_invited}
              </p>
              <p className="font-garamond text-medieval-stone text-xs">
                Convidades
              </p>
            </div>
            <div className="text-center">
              <p className="font-cinzel font-bold text-lg text-medieval-gold">
                {quedadaStats.upcoming}
              </p>
              <p className="font-garamond text-medieval-stone text-xs">
                Properes
              </p>
            </div>
          </div>
          {quedadaStats.frequent_partners.length > 0 && (
            <div>
              <p className="font-garamond text-medieval-stone text-xs mb-2 flex items-center gap-1">
                <Users size={12} /> Companys frequents
              </p>
              <div className="flex flex-wrap gap-2">
                {quedadaStats.frequent_partners.map(({ player, count }) => (
                  <Link
                    key={player.id}
                    href={`/players/${player.id}`}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-medieval border border-medieval-brown/20 bg-parchment-light text-xs font-garamond hover:border-medieval-gold transition-colors"
                  >
                    <MeepleIcon
                      color={player.color}
                      size={14}
                      name={player.name}
                    />
                    {player.name}
                    <span className="text-medieval-stone">({count}x)</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
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
          {"\u2190"} Tornar al Tauler
        </Link>
      </div>
    </div>
  );
}
