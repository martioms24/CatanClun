import { getRecentActivity } from "@/app/actions/forum-actions";
import { getPlayerPointsAll } from "@/app/actions/gambling-actions";
import { getForumPosts } from "@/app/actions/forum-post-actions";
import { getCurrentPlayer } from "@/app/actions/auth-actions";
import { ActivityFeed } from "@/components/forum/ActivityFeed";
import { PointsLeaderboard } from "@/components/forum/PointsLeaderboard";
import { ForumPosts } from "@/components/forum/ForumPosts";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { MessageSquare, Coins, ScrollText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ForumPage() {
  const [activity, points, posts, player] = await Promise.all([
    getRecentActivity(30),
    getPlayerPointsAll(),
    getForumPosts(),
    getCurrentPlayer(),
  ]);

  return (
    <div className="page-container max-w-4xl">
      <h1 className="page-title flex items-center gap-2 mb-1">
        <MessageSquare size={28} />
        Fòrum del Clun
      </h1>
      <p className="page-subtitle">
        Tot el que passa a la colla, en un sol lloc.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Main column */}
        <div className="md:col-span-2 flex flex-col gap-5">
          {/* Forum posts */}
          <Card>
            <CardHeader>
              <ScrollText size={16} className="text-medieval-gold" />
              <CardTitle>Missatges</CardTitle>
            </CardHeader>
            <ForumPosts
              posts={posts}
              currentPlayerId={player?.id ?? null}
            />
          </Card>

          {/* Activity feed */}
          <Card>
            <CardHeader>
              <MessageSquare size={16} className="text-medieval-gold" />
              <CardTitle>Activitat Recent</CardTitle>
            </CardHeader>
            <ActivityFeed items={activity} />
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <Coins size={16} className="text-medieval-gold" />
              <CardTitle>Punts</CardTitle>
            </CardHeader>
            <PointsLeaderboard points={points} />
            <p className="font-garamond text-medieval-stone text-xs mt-3 text-center">
              +5 per partida &middot; +20 per victòria &middot; +5 per quedada
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
