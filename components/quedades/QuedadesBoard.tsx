"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CreateQuedadaForm } from "./CreateQuedadaForm";
import { QuedadaCard } from "./QuedadaCard";
import { cn } from "@/lib/utils";
import type { Quedada, Player, QuedadaStatus } from "@/types";
import { PlusCircle, CalendarHeart, CalendarCheck, CalendarX } from "lucide-react";

type Tab = "upcoming" | "confirmed" | "rejected";

const TABS: { key: Tab; label: string; icon: typeof CalendarHeart }[] = [
  { key: "upcoming", label: "Pendents", icon: CalendarHeart },
  { key: "confirmed", label: "Confirmades", icon: CalendarCheck },
  { key: "rejected", label: "Rebutjades", icon: CalendarX },
];

function filterQuedadas(quedadas: Quedada[], tab: Tab): Quedada[] {
  if (tab === "upcoming") {
    return quedadas.filter((q) => q.status === "pending");
  }
  if (tab === "confirmed") {
    return quedadas.filter((q) => q.status === "confirmed");
  }
  return quedadas.filter((q) => q.status === "rejected");
}

export function QuedadesBoard({
  initialQuedadas,
  players,
  currentPlayerId,
}: {
  initialQuedadas: Quedada[];
  players: Player[];
  currentPlayerId: string | null;
}) {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [showForm, setShowForm] = useState(false);

  const counts: Record<Tab, number> = {
    upcoming: initialQuedadas.filter((q) => q.status === "pending").length,
    confirmed: initialQuedadas.filter((q) => q.status === "confirmed").length,
    rejected: initialQuedadas.filter((q) => q.status === "rejected").length,
  };

  const visible = filterQuedadas(initialQuedadas, tab);

  return (
    <div>
      {/* Create quedada */}
      <div className="mb-5">
        {!showForm ? (
          <Button
            variant="primary"
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto"
          >
            <PlusCircle size={16} />
            Proposar quedada
          </Button>
        ) : (
          <CreateQuedadaForm
            players={players}
            currentPlayerId={currentPlayerId}
            onClose={() => setShowForm(false)}
          />
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b-2 border-medieval-brown/20 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 font-cinzel text-sm transition-colors whitespace-nowrap -mb-0.5 border-b-2",
              tab === key
                ? "text-medieval-gold border-medieval-gold font-semibold"
                : "text-medieval-stone border-transparent hover:text-medieval-brown"
            )}
          >
            <Icon size={14} />
            {label}
            <span
              className={cn(
                "ml-1 rounded-full px-1.5 text-xs",
                tab === key
                  ? "bg-medieval-gold/20 text-medieval-dark"
                  : "bg-medieval-brown/10 text-medieval-stone"
              )}
            >
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Quedadas list */}
      {visible.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-medieval-stone font-garamond">
            <CalendarHeart size={32} className="mx-auto mb-2 opacity-30" />
            {tab === "upcoming" && <p>Cap quedada pendent. Proposa-ne una!</p>}
            {tab === "confirmed" && <p>Encara no hi ha quedades confirmades.</p>}
            {tab === "rejected" && <p>Cap quedada rebutjada.</p>}
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((quedada) => (
            <QuedadaCard
              key={quedada.id}
              quedada={quedada}
              currentPlayerId={currentPlayerId}
              players={players}
            />
          ))}
        </div>
      )}
    </div>
  );
}
