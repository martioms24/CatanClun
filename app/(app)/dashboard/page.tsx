import { Suspense } from "react";
import Link from "next/link";
import { getPlayerStats, getGames } from "@/app/actions/game-actions";
import { Leaderboard, StatsCards } from "@/components/dashboard/Leaderboard";
import { GameCard } from "@/components/game/GameCard";
import { Button } from "@/components/ui/Button";
import { MeepleIcon } from "@/components/ui/MeepleIcon";
import { PlusCircle, Swords } from "lucide-react";

export const dynamic = "force-dynamic";

async function DashboardContent() {
  const [stats, games] = await Promise.all([getPlayerStats(), getGames()]);
  const recentGames = games.slice(0, 5);
  const totalGames = games.length;

  return (
    <div className="page-container">
      <div className="mb-6 text-center sm:text-left">
        <div className="flex items-center gap-3 justify-center sm:justify-start mb-1">
          <MeepleIcon color="#D4AF37" size={32} />
          <h1 className="page-title">Tauler d&apos;Honor</h1>
        </div>
        <p className="page-subtitle">
          {totalGames === 0
            ? "Encara no hi ha partides — comença la primera!"
            : `${totalGames} ${totalGames === 1 ? "partida" : "partides"} a les cròniques`}
        </p>
        <div className="flex gap-3 justify-center sm:justify-start">
          <Link href="/games/new">
            <Button size="md">
              <PlusCircle size={16} />
              Nova Partida
            </Button>
          </Link>
          <Link href="/games">
            <Button variant="secondary" size="md">
              <Swords size={16} />
              Totes les Partides
            </Button>
          </Link>
        </div>
      </div>

      {totalGames > 0 && (
        <div className="mb-6">
          <StatsCards stats={stats} />
        </div>
      )}

      <div className="mb-6">
        <Leaderboard stats={stats} />
      </div>

      {recentGames.length > 0 && (
        <div>
          <div className="divider-ornament">
            <span className="font-cinzel text-sm text-medieval-gold/60 px-2">
              Batalles Recents
            </span>
          </div>
          <div className="flex flex-col gap-3 mt-4">
            {recentGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
          {games.length > 5 && (
            <div className="text-center mt-4">
              <Link href="/games">
                <Button variant="ghost">
                  Veure totes les {games.length} partides →
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {totalGames === 0 && (
        <div className="text-center py-16">
          <div className="flex justify-center gap-3 mb-6">
            {["#E53E3E", "#3182CE", "#38A169", "#D69E2E", "#805AD5", "#DD6B20"].map(
              (color, i) => (
                <MeepleIcon key={i} color={color} size={36} />
              )
            )}
          </div>
          <p className="font-garamond text-medieval-stone text-lg mb-2">
            Les cròniques estan buides...
          </p>
          <p className="font-garamond text-medieval-stone/60 text-sm mb-6">
            Registra la teva primera batalla de Carcassonne per iniciar la llegenda.
          </p>
          <Link href="/games/new">
            <Button size="lg">🏰 Registra la Primera Partida</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="page-container animate-pulse">
          <div className="h-8 w-48 bg-medieval-brown/20 rounded mb-4" />
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-medieval-brown/10 rounded-medieval" />
            ))}
          </div>
          <div className="h-64 bg-medieval-brown/10 rounded-medieval" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
