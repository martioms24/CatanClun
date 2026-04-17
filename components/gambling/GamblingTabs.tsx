"use client";

import { useState } from "react";
import { GamblingBoard } from "./GamblingBoard";
import { SlotsGame } from "./SlotsGame";
import { MinesGame } from "./MinesGame";
import { SportsSection } from "./SportsSection";
import { cn } from "@/lib/utils";
import type { Bet, PlayerPoints, SportsMatch } from "@/types";
import { Dices, Gamepad2, Bomb, Trophy } from "lucide-react";

type Section = "bets" | "sports" | "slots" | "mines";

const SECTIONS: { key: Section; label: string; icon: typeof Dices }[] = [
  { key: "bets", label: "Apostes", icon: Dices },
  { key: "sports", label: "Esports", icon: Trophy },
  { key: "slots", label: "Slots", icon: Gamepad2 },
  { key: "mines", label: "Mines", icon: Bomb },
];

export function GamblingTabs({
  initialBets,
  currentPlayerId,
  points,
  upcomingMatches,
  recentResults,
}: {
  initialBets: Bet[];
  currentPlayerId: string | null;
  points: PlayerPoints[];
  upcomingMatches: SportsMatch[];
  recentResults: SportsMatch[];
}) {
  const [section, setSection] = useState<Section>("bets");

  const myPoints = points.find((p) => p.player.id === currentPlayerId);
  const currentBalance = myPoints?.balance ?? 0;

  return (
    <div>
      {/* Balance bar */}
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-2 bg-medieval-gold/10 border-2 border-medieval-gold rounded-medieval px-4 py-2">
          <span className="font-cinzel text-medieval-dark text-sm">
            Saldo:
          </span>
          <span className="font-cinzel text-medieval-gold font-bold text-lg">
            {currentBalance}
          </span>
          <span className="font-garamond text-medieval-stone text-xs">
            pts
          </span>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 mb-5 border-b-2 border-medieval-brown/20 overflow-x-auto">
        {SECTIONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 font-cinzel text-sm transition-colors whitespace-nowrap -mb-0.5 border-b-2",
              section === key
                ? "text-medieval-gold border-medieval-gold font-semibold"
                : "text-medieval-stone border-transparent hover:text-medieval-brown"
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {section === "bets" && (
        <GamblingBoard
          initialBets={initialBets}
          currentPlayerId={currentPlayerId}
          points={points}
        />
      )}
      {section === "sports" && (
        <SportsSection
          initialMatches={upcomingMatches}
          initialResults={recentResults}
          currentPlayerId={currentPlayerId}
          currentBalance={currentBalance}
        />
      )}
      {section === "slots" && (
        <SlotsGame
          currentPlayerId={currentPlayerId}
          currentBalance={currentBalance}
        />
      )}
      {section === "mines" && (
        <MinesGame
          currentPlayerId={currentPlayerId}
          currentBalance={currentBalance}
        />
      )}
    </div>
  );
}
