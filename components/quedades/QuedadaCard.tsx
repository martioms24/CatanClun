"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MeepleIcon } from "@/components/ui/MeepleIcon";
import { deleteQuedada, updateQuedada } from "@/app/actions/quedada-actions";
import { QUEDADA_TYPES } from "@/lib/quedada-types";
import { cn } from "@/lib/utils";
import type { Quedada, Player, QuedadaType } from "@/types";
import { Check, X, Trash2, CalendarDays, Pencil, Coins } from "lucide-react";

export function QuedadaCard({
  quedada,
  currentPlayerId,
  players,
}: {
  quedada: Quedada;
  currentPlayerId: string | null;
  players: Player[];
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDate, setEditDate] = useState(quedada.date);
  const [editDesc, setEditDesc] = useState(quedada.description ?? "");
  const [editType, setEditType] = useState<QuedadaType>(quedada.type ?? "default");
  const [editPoints, setEditPoints] = useState(quedada.points ?? 4);
  const [editParticipants, setEditParticipants] = useState<Set<string>>(
    new Set(quedada.participants?.map((p) => p.player_id) ?? [])
  );
  const [editError, setEditError] = useState<string | null>(null);

  const dateStr = new Date(quedada.date + "T00:00:00").toLocaleDateString(
    "ca-ES",
    { weekday: "long", day: "numeric", month: "long" }
  );

  const isCreator = quedada.created_by === currentPlayerId;
  const typeInfo = QUEDADA_TYPES.find((t) => t.type === (quedada.type ?? "default")) ?? QUEDADA_TYPES[0];

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    setConfirmDelete(false);
    startTransition(async () => {
      await deleteQuedada(quedada.id);
    });
  }

  function startEdit() {
    setEditDate(quedada.date);
    setEditDesc(quedada.description ?? "");
    setEditType(quedada.type ?? "default");
    setEditPoints(quedada.points ?? 4);
    setEditParticipants(
      new Set(quedada.participants?.map((p) => p.player_id) ?? [])
    );
    setEditError(null);
    setEditing(true);
  }

  function toggleEditPlayer(id: string) {
    setEditParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditError(null);
    if (editParticipants.size < 1) {
      setEditError("Cal almenys 1 participant.");
      return;
    }
    const typeInf = QUEDADA_TYPES.find((t) => t.type === editType);
    const pts = editType === "custom" ? editPoints : (typeInf?.points ?? 4);
    startTransition(async () => {
      const result = await updateQuedada(
        quedada.id,
        editDate,
        editType,
        pts,
        editDesc || undefined,
        Array.from(editParticipants)
      );
      if (result.error) {
        setEditError(result.error);
        return;
      }
      setEditing(false);
    });
  }

  // ── Edit mode ─────────────────────────────────────────────
  if (editing) {
    const editTypeInfo = QUEDADA_TYPES.find((t) => t.type === editType)!;
    return (
      <Card className={cn("transition-opacity", isPending && "opacity-50")}>
        <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
          <p className="font-cinzel text-medieval-dark text-sm font-semibold">
            Editar quedada
          </p>

          {/* Type */}
          <div>
            <label className="font-garamond text-medieval-stone text-xs mb-1.5 block">
              Tipus
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUEDADA_TYPES.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => setEditType(t.type)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-medieval border text-xs font-garamond transition-all",
                    editType === t.type
                      ? "bg-medieval-gold/20 border-medieval-gold text-medieval-dark font-semibold"
                      : "bg-parchment-light border-medieval-brown/20 text-medieval-stone hover:border-medieval-brown/40"
                  )}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          {editType === "custom" && (
            <div className="flex items-center gap-2">
              <Coins size={12} className="text-medieval-gold" />
              <input
                type="number"
                value={editPoints}
                onChange={(e) => setEditPoints(Math.max(0, Number(e.target.value)))}
                min={0}
                max={100}
                className="w-20 px-2 py-1 rounded-medieval border border-medieval-brown/30 bg-parchment-light font-garamond text-medieval-dark text-sm focus:outline-none focus:border-medieval-gold"
              />
              <span className="font-garamond text-medieval-stone text-xs">pts</span>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="font-garamond text-medieval-stone text-xs mb-1 block">
              Data
            </label>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="w-full px-3 py-2 rounded-medieval border-2 border-medieval-brown/30 bg-parchment-light font-garamond text-medieval-dark text-sm focus:outline-none focus:border-medieval-gold transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="font-garamond text-medieval-stone text-xs mb-1 block">
              Descripció (opcional)
            </label>
            <input
              type="text"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Què heu fet?"
              maxLength={200}
              className="w-full px-3 py-2 rounded-medieval border-2 border-medieval-brown/30 bg-parchment-light font-garamond text-medieval-dark text-sm focus:outline-none focus:border-medieval-gold transition-colors"
            />
          </div>

          {/* Participants */}
          <div>
            <label className="font-garamond text-medieval-stone text-xs mb-1.5 block">
              Participants ({editParticipants.size})
            </label>
            <div className="flex flex-wrap gap-1.5">
              {players.map((p) => {
                const selected = editParticipants.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleEditPlayer(p.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-medieval border text-xs font-garamond transition-all",
                      selected
                        ? "bg-medieval-gold/20 border-medieval-gold text-medieval-dark font-semibold"
                        : "bg-parchment-light border-medieval-brown/20 text-medieval-stone hover:border-medieval-brown/40"
                    )}
                  >
                    <MeepleIcon color={p.color} size={14} name={p.name} />
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {editError && (
            <p className="font-garamond text-red-700 text-sm">{editError}</p>
          )}

          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm" loading={isPending}>
              <Check size={14} />
              Desar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditing(false)}
            >
              <X size={14} />
              Cancel·lar
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  // ── View mode ─────────────────────────────────────────────
  return (
    <Card
      variant="gold"
      className={cn("transition-opacity", isPending && "opacity-50")}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={16} className="text-medieval-gold shrink-0" />
            <span className="font-cinzel text-medieval-dark text-sm font-semibold capitalize">
              {dateStr}
            </span>
          </div>
          <div className="flex items-center gap-2 ml-6 flex-wrap">
            <span className="text-sm">{typeInfo.emoji}</span>
            <span className="font-garamond text-medieval-dark text-sm font-semibold">
              {typeInfo.label}
            </span>
            {quedada.description && (
              <span className="font-garamond text-medieval-stone text-sm">
                — {quedada.description}
              </span>
            )}
          </div>
          <p className="font-garamond text-medieval-stone text-xs ml-6 mt-0.5">
            Registrada per{" "}
            <span className="font-semibold">
              {quedada.creator?.name ?? "Desconegut"}
            </span>
          </p>
        </div>

        <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-medieval-gold/20 font-cinzel text-xs font-semibold text-medieval-gold">
          <Coins size={10} />
          {quedada.points ?? 4} pts
        </span>
      </div>

      {/* Participants */}
      <div className="flex flex-wrap gap-2 mb-3">
        {quedada.participants?.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-1.5 px-2 py-1 rounded-medieval border bg-medieval-green/10 border-medieval-green/30 text-xs font-garamond text-medieval-dark"
          >
            <MeepleIcon
              color={p.player?.color ?? "#8B4513"}
              size={14}
              name={p.player?.name}
            />
            <span>{p.player?.name}</span>
          </div>
        ))}
      </div>

      {/* Actions — only creator can edit/delete */}
      {isCreator && (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={startEdit}
            disabled={isPending}
            aria-label="Editar"
            className="p-1.5 rounded-medieval border border-medieval-brown/30 bg-parchment-light text-medieval-brown hover:bg-parchment transition-colors disabled:opacity-50"
          >
            <Pencil size={14} />
          </button>
          {confirmDelete ? (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex items-center gap-1 px-2 py-1 rounded-medieval border-2 border-red-900 bg-medieval-burgundy text-parchment font-cinzel text-xs font-semibold transition-colors disabled:opacity-50 animate-pulse"
            >
              <Trash2 size={12} />
              Segur?
            </button>
          ) : (
            <button
              onClick={handleDelete}
              disabled={isPending}
              aria-label="Eliminar"
              className="p-1.5 rounded-medieval border border-medieval-burgundy/40 bg-medieval-burgundy/10 text-medieval-burgundy hover:bg-medieval-burgundy/20 transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
