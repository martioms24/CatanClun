import { getPeakCompletions } from "@/app/actions/cims-actions";
import { getPlayers } from "@/app/actions/game-actions";
import { CimsMapLoader } from "@/components/cims/CimsMapLoader";
import { Mountain } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CimsPage() {
  const [completions, players] = await Promise.all([
    getPeakCompletions(),
    getPlayers(),
  ]);

  return (
    <div className="page-container max-w-4xl">
      <h1 className="page-title flex items-center gap-2 mb-1">
        <Mountain size={28} />
        100 Cims
      </h1>
      <p className="page-subtitle">
        El repte dels 100 Cims de la FEEC. Puja&apos;ls tots!
      </p>

      <CimsMapLoader completions={completions} players={players} />
    </div>
  );
}
