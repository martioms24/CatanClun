"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CreateQuedadaForm } from "./CreateQuedadaForm";
import { QuedadaCard } from "./QuedadaCard";
import type { Quedada, Player } from "@/types";
import { PlusCircle, CalendarHeart } from "lucide-react";

export function QuedadesBoard({
  initialQuedadas,
  players,
  currentPlayerId,
}: {
  initialQuedadas: Quedada[];
  players: Player[];
  currentPlayerId: string | null;
}) {
  const [showForm, setShowForm] = useState(false);

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
            Registrar quedada
          </Button>
        ) : (
          <CreateQuedadaForm
            players={players}
            currentPlayerId={currentPlayerId}
            onClose={() => setShowForm(false)}
          />
        )}
      </div>

      {/* Quedadas list */}
      {initialQuedadas.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-medieval-stone font-garamond">
            <CalendarHeart size={32} className="mx-auto mb-2 opacity-30" />
            <p>Cap quedada registrada. Registra-ne una!</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {initialQuedadas.map((quedada) => (
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
