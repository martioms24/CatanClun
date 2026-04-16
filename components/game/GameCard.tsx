import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MeepleIcon } from "@/components/ui/MeepleIcon";
import { formatDate } from "@/lib/utils";
import type { Game } from "@/types";
import { Calendar, Trophy, Puzzle } from "lucide-react";

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const winner = game.results?.find((r) => r.position === 1);
  const sorted = [...(game.results ?? [])].sort(
    (a, b) => a.position - b.position
  );

  return (
    <Link href={`/games/${game.id}`}>
      <Card className="hover:shadow-medieval-lg hover:border-medieval-gold/60 transition-all cursor-pointer group">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-medieval-stone text-sm font-garamond">
            <Calendar size={14} />
            {formatDate(game.played_at)}
          </div>
          {winner?.player && (
            <div className="flex items-center gap-1.5">
              <Trophy size={14} className="text-medieval-gold" />
              <span className="font-cinzel text-sm font-semibold text-medieval-dark">
                {winner.player.name}
              </span>
              <MeepleIcon color={winner.player.color} size={18} name={winner.player.name} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 mb-3">
          {sorted.map((result) => (
            <div key={result.id} className="flex items-center gap-2">
              <span
                className="w-6 text-center text-xs font-cinzel font-bold"
                style={{ color: result.position === 1 ? "#D4AF37" : "#8B8878" }}
              >
                {result.position === 1 ? "👑" : `${result.position}.`}
              </span>
              {result.player && (
                <MeepleIcon color={result.player.color} size={14} name={result.player.name} />
              )}
              <span className="font-garamond text-medieval-dark text-sm flex-1">
                {result.player?.name}
              </span>
              <span className="font-cinzel font-bold text-medieval-dark text-sm tabular-nums">
                {result.score !== null ? `${result.score} pts` : "—"}
              </span>
            </div>
          ))}
        </div>

        {game.extensions && game.extensions.length > 0 && (
          <div className="flex items-start gap-1.5 flex-wrap">
            <Puzzle size={12} className="text-medieval-stone mt-0.5 shrink-0" />
            {game.extensions.map((ext) => (
              <Badge key={ext.id} variant="stone" className="text-xs">
                {ext.name}
              </Badge>
            ))}
          </div>
        )}

        {game.notes && (
          <p className="mt-2 text-medieval-stone text-xs font-garamond italic truncate">
            &ldquo;{game.notes}&rdquo;
          </p>
        )}
      </Card>
    </Link>
  );
}
