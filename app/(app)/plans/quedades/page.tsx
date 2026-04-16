import { getQuedadas } from "@/app/actions/quedada-actions";
import { QuedadesBoard } from "@/components/quedades/QuedadesBoard";
import { getCurrentPlayer } from "@/app/actions/auth-actions";
import { createClient } from "@/lib/supabase/server";
import { CalendarHeart } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function QuedadesPage() {
  const supabase = await createClient();
  const [quedadas, player, { data: players }] = await Promise.all([
    getQuedadas(),
    getCurrentPlayer(),
    supabase.from("players").select("*").order("name"),
  ]);

  return (
    <div className="page-container max-w-2xl">
      <h1 className="page-title flex items-center gap-2 mb-1">
        <CalendarHeart size={28} />
        Quedades
      </h1>
      <p className="page-subtitle">
        Organitza quedades amb la colla i confirma la teva assistència.
      </p>
      <QuedadesBoard
        initialQuedadas={quedadas}
        players={players ?? []}
        currentPlayerId={player?.id ?? null}
      />
    </div>
  );
}
