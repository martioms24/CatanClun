import { getPlayers, getExtensions } from "@/app/actions/game-actions";
import { NewGameForm } from "@/components/game/NewGameForm";
import { PlusCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewGamePage() {
  const [players, extensions] = await Promise.all([
    getPlayers(),
    getExtensions(),
  ]);

  return (
    <div className="page-container">
      <h1 className="page-title flex items-center gap-2 mb-1">
        <PlusCircle size={28} />
        Nova Partida
      </h1>
      <p className="page-subtitle">
        Registra una nova batalla de Carcassonne a les cròniques.
      </p>
      <NewGameForm players={players} extensions={extensions} />
    </div>
  );
}
