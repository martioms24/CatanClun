import { getRedemptions } from "@/app/actions/reward-actions";
import { getPlayerPointsAll } from "@/app/actions/gambling-actions";
import { getCurrentPlayer } from "@/app/actions/auth-actions";
import { getPlayers } from "@/app/actions/game-actions";
import { RewardsCatalog } from "@/components/rewards/RewardsCatalog";
import { RedemptionLog } from "@/components/rewards/RedemptionLog";
import { PointsLeaderboard } from "@/components/forum/PointsLeaderboard";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Gift, Coins, ScrollText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const [redemptions, player, points, players] = await Promise.all([
    getRedemptions(),
    getCurrentPlayer(),
    getPlayerPointsAll(),
    getPlayers(),
  ]);

  const currentBalance =
    points.find((p) => p.player.id === player?.id)?.balance ?? 0;

  return (
    <div className="page-container max-w-4xl">
      <h1 className="page-title flex items-center gap-2 mb-1">
        <Gift size={28} />
        Recompenses
      </h1>
      <p className="page-subtitle">
        Canvia els teus punts per recompenses reals. Qui acumula, triomfa!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 flex flex-col gap-5">
          <RewardsCatalog
            players={players}
            currentPlayerId={player?.id ?? null}
            currentBalance={currentBalance}
          />

          <Card>
            <CardHeader>
              <ScrollText size={16} className="text-medieval-gold" />
              <CardTitle>Historial de canvis</CardTitle>
            </CardHeader>
            <RedemptionLog
              redemptions={redemptions}
              currentPlayerId={player?.id ?? null}
            />
          </Card>
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
