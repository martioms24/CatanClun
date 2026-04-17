import { getBets, getPlayerPointsAll } from "@/app/actions/gambling-actions";
import { getUpcomingMatches, getRecentResults } from "@/app/actions/sports-actions";
import { getCurrentPlayer } from "@/app/actions/auth-actions";
import { GamblingTabs } from "@/components/gambling/GamblingTabs";
import { PointsLeaderboard } from "@/components/forum/PointsLeaderboard";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Dices, Coins } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GamblingPage() {
  const [bets, player, points, upcomingMatches, recentResults] =
    await Promise.all([
      getBets(),
      getCurrentPlayer(),
      getPlayerPointsAll(),
      getUpcomingMatches(),
      getRecentResults(),
    ]);

  return (
    <div className="page-container max-w-4xl">
      <h1 className="page-title flex items-center gap-2 mb-1">
        <Dices size={28} />
        Gambling
      </h1>
      <p className="page-subtitle">
        Apostes, esports, slots i mines. Juga amb els teus punts!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2">
          <GamblingTabs
            initialBets={bets}
            currentPlayerId={player?.id ?? null}
            points={points}
            upcomingMatches={upcomingMatches}
            recentResults={recentResults}
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
