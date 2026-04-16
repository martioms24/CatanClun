import { getBets, getPlayerPointsAll } from "@/app/actions/gambling-actions";
import { getCurrentPlayer } from "@/app/actions/auth-actions";
import { GamblingBoard } from "@/components/gambling/GamblingBoard";
import { PointsLeaderboard } from "@/components/forum/PointsLeaderboard";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Dices, Coins } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GamblingPage() {
  const [bets, player, points] = await Promise.all([
    getBets(),
    getCurrentPlayer(),
    getPlayerPointsAll(),
  ]);

  return (
    <div className="page-container max-w-4xl">
      <h1 className="page-title flex items-center gap-2 mb-1">
        <Dices size={28} />
        Gambling
      </h1>
      <p className="page-subtitle">
        Aposta els teus punts en qualsevol cosa. Multiplicador = nombre
        d&apos;opcions.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2">
          <GamblingBoard
            initialBets={bets}
            currentPlayerId={player?.id ?? null}
            points={points}
          />
        </div>
        <div>
          <Card>
            <CardHeader>
              <Coins size={16} className="text-medieval-gold" />
              <CardTitle>Classificació</CardTitle>
            </CardHeader>
            <PointsLeaderboard points={points} />
          </Card>
        </div>
      </div>
    </div>
  );
}
