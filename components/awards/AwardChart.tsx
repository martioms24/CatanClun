"use client";

import { cn } from "@/lib/utils";
import { PERSON_COLORS, type AwardCategory } from "@/lib/awards-data";

export function AwardChart({ category }: { category: AwardCategory }) {
  const maxVotes = category.results[0]?.votes ?? 1;
  const winner = category.results[0];

  return (
    <div className="flex flex-col gap-2">
      {category.results.map((r, i) => {
        const pct = Math.round((r.votes / category.totalVotes) * 100);
        const barWidth = Math.round((r.votes / maxVotes) * 100);
        const color = PERSON_COLORS[r.name] ?? "#8B8878";
        const isWinner = i === 0;

        return (
          <div key={r.name} className="flex items-center gap-2">
            <span
              className={cn(
                "font-cinzel text-sm w-[7.5rem] sm:w-40 text-right truncate shrink-0",
                isWinner ? "font-bold text-medieval-dark" : "text-medieval-stone"
              )}
              title={r.name}
            >
              {isWinner && winner.votes > 1 && "👑 "}
              {r.name}
            </span>
            <div className="flex-1 h-7 bg-medieval-brown/10 rounded-medieval overflow-hidden relative">
              <div
                className="h-full rounded-medieval transition-all duration-500 flex items-center justify-end pr-2"
                style={{
                  width: `${Math.max(barWidth, 8)}%`,
                  backgroundColor: color,
                  opacity: isWinner ? 1 : 0.7,
                }}
              >
                {barWidth >= 25 && (
                  <span className="text-white font-cinzel text-xs font-bold drop-shadow-sm">
                    {r.votes}
                  </span>
                )}
              </div>
              {barWidth < 25 && (
                <span
                  className="absolute top-1/2 -translate-y-1/2 font-cinzel text-xs font-bold text-medieval-dark"
                  style={{ left: `${Math.max(barWidth, 8) + 2}%` }}
                >
                  {r.votes}
                </span>
              )}
            </div>
            <span className="font-garamond text-xs text-medieval-stone w-10 text-right shrink-0">
              {pct}%
            </span>
          </div>
        );
      })}
      <p className="font-garamond text-xs text-medieval-stone text-right">
        {category.totalVotes} vots
      </p>
    </div>
  );
}
