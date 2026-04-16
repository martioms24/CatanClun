"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { AwardChart } from "./AwardChart";
import type { AwardsYearData } from "@/lib/awards-data";
import { Trophy, Hourglass } from "lucide-react";

export function AwardsView({ data }: { data: AwardsYearData }) {
  if (data.comingSoon) {
    return (
      <Card>
        <div className="text-center py-12 text-medieval-stone font-garamond">
          <Hourglass size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-cinzel text-lg text-medieval-dark mb-1">
            Pròximament...
          </p>
          <p className="text-sm">
            Les votacions del {data.year} encara no s&apos;han fet.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {data.categories.map((cat) => (
        <Card key={cat.title}>
          <CardHeader>
            <span className="text-xl">{cat.emoji}</span>
            <CardTitle className="text-base">{cat.title}</CardTitle>
            {cat.results[0] && (
              <span className="ml-auto font-cinzel text-sm font-bold text-medieval-gold">
                {cat.results[0].name}
              </span>
            )}
          </CardHeader>
          <AwardChart category={cat} />
        </Card>
      ))}
      <div className="text-center py-4">
        <p className="font-garamond text-medieval-stone text-sm">
          <Trophy size={14} className="inline-block mr-1 -mt-0.5" />
          {data.categories.length} categories — 7 votants
        </p>
      </div>
    </div>
  );
}
