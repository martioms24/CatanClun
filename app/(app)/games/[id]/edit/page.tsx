import { notFound } from "next/navigation";
import { getGame, getPlayers, getExtensions } from "@/app/actions/game-actions";
import { NewGameForm } from "@/components/game/NewGameForm";
import { Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [game, players, extensions] = await Promise.all([
    getGame(id),
    getPlayers(),
    getExtensions(),
  ]);

  if (!game) notFound();

  return (
    <div className="page-container">
      <h1 className="page-title flex items-center gap-2 mb-1">
        <Pencil size={28} />
        Edit Game
      </h1>
      <p className="page-subtitle">Correct the records in the chronicles.</p>
      <NewGameForm players={players} extensions={extensions} editingGame={game} />
    </div>
  );
}
