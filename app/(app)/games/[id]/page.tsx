import { notFound } from "next/navigation";
import Link from "next/link";
import { getGame } from "@/app/actions/game-actions";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MeepleIcon } from "@/components/ui/MeepleIcon";
import { DeleteGameButton } from "./DeleteGameButton";
import { formatDate } from "@/lib/utils";
import { Calendar, Pencil, Trophy, Puzzle, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) notFound();

  const sorted = [...(game.results ?? [])].sort(
    (a, b) => a.position - b.position
  );
  const winner = sorted[0];

  return (
    <div className="page-container max-w-2xl">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 text-medieval-stone font-garamond text-sm mb-1">
            <Calendar size={14} />
            {formatDate(game.played_at)}
          </div>
          <h1 className="page-title mb-0">Detall de la Partida</h1>
          {winner?.player && (
            <p className="font-garamond text-medieval-stone text-base mt-0.5">
              Guanyador/a:{" "}
              <span className="font-cinzel font-bold text-medieval-dark">
                {winner.player.name}
              </span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/games/${id}/edit`}>
            <Button variant="secondary" size="sm">
              <Pencil size={14} />
              Editar
            </Button>
          </Link>
          <DeleteGameButton gameId={id} />
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <Trophy size={16} className="text-medieval-gold" />
          <CardTitle>Resultats</CardTitle>
        </CardHeader>
        <div className="flex flex-col gap-3">
          {sorted.map((result) => (
            <div
              key={result.id}
              className={`flex items-center gap-3 p-3 rounded-medieval border-2 ${
                result.position === 1
                  ? "border-medieval-gold bg-medieval-gold/10"
                  : "border-medieval-brown/10 bg-parchment-light/50"
              }`}
            >
              <span className="text-2xl w-8 text-center shrink-0">
                {result.position === 1
                  ? "👑"
                  : result.position === 2
                  ? "🥈"
                  : result.position === 3
                  ? "🥉"
                  : `${result.position}.`}
              </span>
              {result.player && (
                <>
                  <MeepleIcon color={result.player.color} size={28} name={result.player.name} />
                  <Link
                    href={`/players/${result.player.id}`}
                    className="font-cinzel font-semibold text-medieval-dark hover:text-medieval-gold transition-colors flex-1 text-base"
                  >
                    {result.player.name}
                  </Link>
                </>
              )}
              <span className="font-cinzel font-bold text-medieval-dark text-xl tabular-nums">
                {result.score !== null ? (
                  <>
                    {result.score}
                    <span className="text-sm text-medieval-stone ml-1 font-normal">pts</span>
                  </>
                ) : (
                  <span className="text-sm text-medieval-stone font-normal">sense punts</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {game.extensions && game.extensions.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <Puzzle size={16} className="text-medieval-gold" />
            <CardTitle>Extensions</CardTitle>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            {game.extensions.map((ext) => (
              <Badge key={ext.id} variant={ext.is_official ? "gold" : "stone"}>
                {ext.name}
                {!ext.is_official && " (personalitzada)"}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {game.notes && (
        <Card>
          <CardHeader>
            <FileText size={16} className="text-medieval-gold" />
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <p className="font-garamond text-medieval-dark text-base italic">
            &ldquo;{game.notes}&rdquo;
          </p>
        </Card>
      )}

      <div className="mt-6 flex gap-3">
        <Link href="/games">
          <Button variant="ghost">← Tornar a les Cròniques</Button>
        </Link>
      </div>
    </div>
  );
}
