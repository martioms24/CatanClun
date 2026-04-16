"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MeepleIcon } from "@/components/ui/MeepleIcon";
import { createQuedada } from "@/app/actions/quedada-actions";
import { cn } from "@/lib/utils";
import type { Player } from "@/types";
import { Check, X } from "lucide-react";

export function CreateQuedadaForm({
  players,
  currentPlayerId,
  onClose,
}: {
  players: Player[];
  currentPlayerId: string | null;
  onClose: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(currentPlayerId ? [currentPlayerId] : [])
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function togglePlayer(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (selectedIds.size < 2) {
      setError("Cal seleccionar almenys 2 participants.");
      return;
    }

    startTransition(async () => {
      const result = await createQuedada(
        date,
        Array.from(selectedIds),
        description || undefined
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="font-cinzel text-medieval-dark text-sm">
          Nova quedada
        </label>

        {/* Date */}
        <div>
          <label className="font-garamond text-medieval-stone text-sm mb-1 block">
            Data
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-medieval border-2 border-medieval-brown/30 bg-parchment-light font-garamond text-medieval-dark focus:outline-none focus:border-medieval-gold transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="font-garamond text-medieval-stone text-sm mb-1 block">
            Descripció (opcional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Què fareu?"
            maxLength={200}
            className="w-full px-3 py-2 rounded-medieval border-2 border-medieval-brown/30 bg-parchment-light font-garamond text-medieval-dark focus:outline-none focus:border-medieval-gold transition-colors"
          />
        </div>

        {/* Player selection */}
        <div>
          <label className="font-garamond text-medieval-stone text-sm mb-2 block">
            Participants ({selectedIds.size} seleccionats)
          </label>
          <div className="flex flex-wrap gap-2">
            {players.map((player) => {
              const selected = selectedIds.has(player.id);
              const isCreator = player.id === currentPlayerId;
              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => togglePlayer(player.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-medieval border-2 text-sm font-garamond transition-all",
                    selected
                      ? "bg-medieval-gold/20 border-medieval-gold text-medieval-dark font-semibold"
                      : "bg-parchment-light border-medieval-brown/20 text-medieval-stone hover:border-medieval-brown/40"
                  )}
                >
                  <MeepleIcon
                    color={player.color}
                    size={18}
                    name={player.name}
                  />
                  {player.name}
                  {isCreator && (
                    <span className="text-xs opacity-60">(tu)</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="font-garamond text-red-700 text-sm">{error}</p>
        )}

        <div className="flex gap-2">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isPending}
            disabled={selectedIds.size < 2}
          >
            <Check size={14} />
            Proposar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X size={14} />
            Cancel·lar
          </Button>
        </div>
      </form>
    </Card>
  );
}
