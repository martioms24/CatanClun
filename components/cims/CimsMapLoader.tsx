"use client";

import dynamic from "next/dynamic";
import { Mountain } from "lucide-react";
import type { PeakCompletion, Player } from "@/types";

const CimsMap = dynamic(
  () => import("@/components/cims/CimsMap").then((m) => m.CimsMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[450px] rounded-medieval border-2 border-medieval-brown/30 flex items-center justify-center bg-parchment-light">
        <div className="text-center">
          <Mountain
            size={32}
            className="mx-auto mb-2 text-medieval-stone animate-pulse"
          />
          <p className="font-garamond text-medieval-stone">
            Carregant mapa...
          </p>
        </div>
      </div>
    ),
  }
);

export function CimsMapLoader({
  completions,
  players,
}: {
  completions: PeakCompletion[];
  players: Player[];
}) {
  return <CimsMap completions={completions} players={players} />;
}
