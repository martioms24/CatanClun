"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MeepleIcon } from "@/components/ui/MeepleIcon";
import { createQuedada } from "@/app/actions/quedada-actions";
import { QUEDADA_TYPES } from "@/lib/quedada-types";
import { cn } from "@/lib/utils";
import type { Player, QuedadaType } from "@/types";
import { Check, X, Coins } from "lucide-react";

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
  const [quedadaType, setQuedadaType] = useState<QuedadaType>("default");
  const [customPoints, setCustomPoints] = useState(4);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(currentPlayerId ? [currentPlayerId] : [])
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const typeInfo = QUEDADA_TYPES.find((t) => t.type === quedadaType)!;

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

    if (selectedIds.size < 1) {
      setError("Cal seleccionar almenys 1 participant.");
      return;
    }

    startTransition(async () => {
      const result = await createQuedada(
        date,
        Array.from(selectedIds),
        quedadaType,
        quedadaType === "custom" ? customPoints : typeInfo.points,
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
          Registrar quedada
        </label>

        {/* Type selector */}
        <div>
          <label className="font-garamond text-medieval-stone text-sm mb-1.5 block">
            Tipus d&apos;activitat
          </label>
          <div className="flex flex-wrap gap-2">
            {QUEDADA_TYPES.map((t) => (
              <button
                key={t.type}
                type="button"
                onClick={() => setQuedadaType(t.type)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-medieval border-2 text-sm font-garamond transition-all",
                  quedadaType === t.type
                    ? "bg-medieval-gold/20 border-medieval-gold text-medieval-dark font-semibold"
                    : "bg-parchment-light border-medieval-brown/20 text-medieval-stone hover:border-medieval-brown/40"
                )}
              >
                <span>{t.emoji}</span>
                {t.label}
                {t.type !== "custom" && (
                  <span className="text-xs text-medieval-gold font-cinzel ml-1">
                    {t.points}pts
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom points input */}
        {quedadaType === "custom" && (
          <div>
            <label className="font-garamond text-medieval-stone text-sm mb-1 block">
              Punts per participant
            </label>
            <div className="flex items-center gap-2">
              <Coins size={14} className="text-medieval-gold" />
              <input
                type="number"
                value={customPoints}
                onChange={(e) => setCustomPoints(Math.max(0, Number(e.target.value)))}
                min={0}
                max={100}
                className="w-20 px-3 py-2 rounded-medieval border-2 border-medieval-brown/30 bg-parchment-light font-garamond text-medieval-dark focus:outline-none focus:border-medieval-gold transition-colors"
              />
              <span className="font-garamond text-medieval-stone text-sm">pts</span>
            </div>
          </div>
        )}

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
            placeholder={quedadaType === "custom" ? "Nom de l'activitat..." : "Què heu fet?"}
            maxLength={200}
            className="w-full px-3 py-2 rounded-medieval border-2 border-medieval-brown/30 bg-parchment-light font-garamond text-medieval-dark focus:outline-none focus:border-medieval-gold transition-colors"
          />
        </div>

        {/* Player selection */}
        <div>
          <label className="font-garamond text-medieval-stone text-sm mb-2 block">
            Participants ({selectedIds.size})
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
            disabled={selectedIds.size < 1}
          >
            <Check size={14} />
            Registrar
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
