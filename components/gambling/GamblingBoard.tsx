"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CreateBetForm } from "./CreateBetForm";
import { BetCard } from "./BetCard";
import { cn } from "@/lib/utils";
import type { Bet, PlayerPoints } from "@/types";
import { PlusCircle, Dices, Lock, Trophy } from "lucide-react";

type Tab = "open" | "closed" | "resolved";

const TABS: { key: Tab; label: string; icon: typeof Dices }[] = [
  { key: "open", label: "Obertes", icon: Dices },
  { key: "closed", label: "Tancades", icon: Lock },
  { key: "resolved", label: "Resoltes", icon: Trophy },
];

export function GamblingBoard({
  initialBets,
  currentPlayerId,
  points,
}: {
  initialBets: Bet[];
  currentPlayerId: string | null;
  points: PlayerPoints[];
}) {
  const [tab, setTab] = useState<Tab>("open");
  const [showForm, setShowForm] = useState(false);

  const myPoints = points.find((p) => p.player.id === currentPlayerId);
  const currentBalance = myPoints?.balance ?? 0;

  const counts: Record<Tab, number> = {
    open: initialBets.filter((b) => b.status === "open").length,
    closed: initialBets.filter((b) => b.status === "closed").length,
    resolved: initialBets.filter((b) => b.status === "resolved").length,
  };

  const visible = initialBets.filter((b) => b.status === tab);

  return (
    <div>
      {/* Balance + create */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        {!showForm ? (
          <Button
            variant="primary"
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto"
          >
            <PlusCircle size={16} />
            Crear aposta
          </Button>
        ) : (
          <div className="w-full">
            <CreateBetForm onClose={() => setShowForm(false)} />
          </div>
        )}
        {!showForm && (
          <div className="flex items-center gap-2 bg-medieval-gold/10 border-2 border-medieval-gold rounded-medieval px-4 py-2">
            <span className="font-cinzel text-medieval-dark text-sm">
              El teu saldo:
            </span>
            <span className="font-cinzel text-medieval-gold font-bold text-lg">
              {currentBalance}
            </span>
            <span className="font-garamond text-medieval-stone text-xs">
              pts
            </span>
          </div>
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

      {/* Bets list */}
      {visible.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-medieval-stone font-garamond">
            <Dices size={32} className="mx-auto mb-2 opacity-30" />
            {tab === "open" && <p>Cap aposta oberta. Crea-ne una!</p>}
            {tab === "closed" && <p>Cap aposta tancada.</p>}
            {tab === "resolved" && <p>Cap aposta resolta encara.</p>}
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((bet) => (
            <BetCard
              key={bet.id}
              bet={bet}
              currentPlayerId={currentPlayerId}
              currentBalance={currentBalance}
            />
          ))}
        </div>
      )}
    </div>
  );
}
