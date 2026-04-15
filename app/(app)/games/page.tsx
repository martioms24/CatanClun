import { Suspense } from "react";
import Link from "next/link";
import { getGames, getPlayers, getExtensions } from "@/app/actions/game-actions";
import { GameCard } from "@/components/game/GameCard";
import { Button } from "@/components/ui/Button";
import { PlusCircle, Swords } from "lucide-react";

export const dynamic = "force-dynamic";

async function GamesContent({
  searchParams,
}: {
  searchParams: { player?: string; extension?: string };
}) {
  const [games, players, extensions] = await Promise.all([
    getGames(),
    getPlayers(),
    getExtensions(),
  ]);

  const filterPlayerId = searchParams.player;
  const filterExtId = searchParams.extension;

  const filtered = games.filter((g) => {
    if (filterPlayerId && !g.results?.some((r) => r.player_id === filterPlayerId))
      return false;
    if (filterExtId && !g.extensions?.some((e) => e.id === filterExtId))
      return false;
    return true;
  });

  return (
    <div className="page-container">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Swords size={28} />
            Cròniques de Partides
          </h1>
          <p className="page-subtitle">
            {filtered.length} de {games.length} partides
          </p>
        </div>
        <Link href="/games/new">
          <Button size="md">
            <PlusCircle size={16} />
            Nova Partida
          </Button>
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="font-cinzel text-sm text-medieval-stone self-center">
          Filtre:
        </span>

        <Link
          href="/games"
          className={`px-3 py-1.5 rounded-medieval border-2 font-cinzel text-xs transition-all ${
            !filterPlayerId && !filterExtId
              ? "bg-medieval-gold text-medieval-dark border-medieval-gold"
              : "bg-parchment border-medieval-brown/20 text-medieval-stone hover:border-medieval-brown/40"
          }`}
        >
          Totes
        </Link>

        {players.map((p) => (
          <Link
            key={p.id}
            href={filterPlayerId === p.id ? "/games" : `/games?player=${p.id}`}
            className={`px-3 py-1.5 rounded-medieval border-2 font-cinzel text-xs transition-all ${
              filterPlayerId === p.id
                ? "bg-medieval-gold text-medieval-dark border-medieval-gold"
                : "bg-parchment border-medieval-brown/20 text-medieval-stone hover:border-medieval-brown/40"
            }`}
          >
            {p.name}
          </Link>
        ))}

        {extensions.slice(0, 6).map((e) => (
          <Link
            key={e.id}
            href={filterExtId === e.id ? "/games" : `/games?extension=${e.id}`}
            className={`px-3 py-1.5 rounded-medieval border-2 font-garamond text-xs transition-all ${
              filterExtId === e.id
                ? "bg-medieval-gold text-medieval-dark border-medieval-gold"
                : "bg-parchment border-medieval-brown/20 text-medieval-stone hover:border-medieval-brown/40"
            }`}
          >
            {e.name}
          </Link>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filtered.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Swords size={48} className="mx-auto mb-4 text-medieval-stone/30" />
          <p className="font-garamond text-medieval-stone text-lg">
            No s&apos;han trobat partides.
          </p>
          {(filterPlayerId || filterExtId) && (
            <Link href="/games" className="text-medieval-gold underline font-garamond">
              Esborra els filtres
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ player?: string; extension?: string }>;
}) {
  const params = await searchParams;
  return (
    <Suspense
      fallback={
        <div className="page-container animate-pulse">
          <div className="h-8 w-48 bg-medieval-brown/20 rounded mb-6" />
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-medieval-brown/10 rounded-medieval" />
            ))}
          </div>
        </div>
      }
    >
      <GamesContent searchParams={params} />
    </Suspense>
  );
}
