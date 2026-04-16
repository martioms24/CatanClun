"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/types";
import {
  Swords,
  CalendarHeart,
  ListChecks,
  Dices,
  Trophy,
} from "lucide-react";

const ICONS: Record<ActivityItem["type"], typeof Swords> = {
  game: Swords,
  quedada: CalendarHeart,
  plan: ListChecks,
  bet_created: Dices,
  bet_resolved: Trophy,
};

const COLORS: Record<ActivityItem["type"], string> = {
  game: "text-medieval-brown border-medieval-brown/30 bg-medieval-brown/10",
  quedada: "text-medieval-green border-medieval-green/30 bg-medieval-green/10",
  plan: "text-medieval-blue border-medieval-blue/30 bg-medieval-blue/10",
  bet_created: "text-medieval-gold border-medieval-gold/30 bg-medieval-gold/10",
  bet_resolved: "text-medieval-burgundy border-medieval-burgundy/30 bg-medieval-burgundy/10",
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-medieval-stone font-garamond text-center py-8">
        Encara no hi ha activitat recent.
      </p>
    );
  }

  let lastDate = "";

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => {
        const showDate = item.date !== lastDate;
        lastDate = item.date;
        const Icon = ICONS[item.type];
        const dateStr = new Date(item.date + "T00:00:00").toLocaleDateString(
          "ca-ES",
          { day: "numeric", month: "long", year: "numeric" }
        );

        return (
          <div key={`${item.type}-${item.date}-${i}`}>
            {showDate && (
              <p className="font-cinzel text-xs text-medieval-stone mt-3 mb-1.5 first:mt-0">
                {dateStr}
              </p>
            )}
            <Link
              href={item.link ?? "#"}
              className="flex items-start gap-3 p-3 rounded-medieval border bg-parchment hover:bg-parchment-dark/30 transition-colors"
            >
              <span
                className={cn(
                  "shrink-0 p-1.5 rounded-full border",
                  COLORS[item.type]
                )}
              >
                <Icon size={14} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-cinzel text-medieval-dark text-sm font-semibold leading-tight">
                  {item.title}
                </p>
                {item.description && (
                  <p className="font-garamond text-medieval-stone text-xs mt-0.5 truncate">
                    {item.description}
                  </p>
                )}
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
