"use client";

import Link from "next/link";
import { MeepleIcon } from "@/components/ui/MeepleIcon";
import { cn } from "@/lib/utils";
import type { PlayerPoints } from "@/types";
import { Coins } from "lucide-react";

export function PointsLeaderboard({ points }: { points: PlayerPoints[] }) {
  const sorted = [...points].sort((a, b) => b.balance - a.balance);

  return (
    <div className="flex flex-col gap-1.5">
      {sorted.map((pp, i) => (
        <Link
          key={pp.player.id}
          href={`/players/${pp.player.id}`}
          className={cn(
            "flex items-center gap-3 p-2.5 rounded-medieval border transition-colors hover:bg-parchment-dark/30",
            i === 0
              ? "border-medieval-gold bg-medieval-gold/10"
              : "border-medieval-brown/20 bg-parchment"
          )}
        >
          <span className="font-cinzel text-medieval-stone text-xs w-5 text-center">
            {i + 1}
          </span>
          <MeepleIcon
            color={pp.player.color}
            size={20}
            name={pp.player.name}
          />
          <span className="font-cinzel text-medieval-dark text-sm font-semibold flex-1">
            {pp.player.name}
          </span>
          <div className="flex items-center gap-1">
            <Coins size={14} className="text-medieval-gold" />
            <span className="font-cinzel text-medieval-gold font-bold text-sm">
              {pp.balance}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
