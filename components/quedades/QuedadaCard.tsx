"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { MeepleIcon } from "@/components/ui/MeepleIcon";
import { respondToQuedada, deleteQuedada } from "@/app/actions/quedada-actions";
import { cn } from "@/lib/utils";
import type { Quedada } from "@/types";
import {
  Check,
  X,
  Trash2,
  Clock,
  CalendarDays,
} from "lucide-react";

export function QuedadaCard({
  quedada,
  currentPlayerId,
}: {
  quedada: Quedada;
  currentPlayerId: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const dateStr = new Date(quedada.date + "T00:00:00").toLocaleDateString("ca-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const myParticipation = quedada.participants?.find(
    (p) => p.player_id === currentPlayerId
  );
  const needsMyResponse =
    myParticipation?.status === "pending" && quedada.status === "pending";
  const isCreator = quedada.created_by === currentPlayerId;

  const confirmedCount =
    quedada.participants?.filter((p) => p.status === "confirmed").length ?? 0;
  const totalCount = quedada.participants?.length ?? 0;

  function handleRespond(response: "confirmed" | "rejected") {
    startTransition(async () => {
      await respondToQuedada(quedada.id, response);
    });
  }

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

  const variant =
    quedada.status === "confirmed"
      ? "gold"
      : quedada.status === "rejected"
      ? "stone"
      : "parchment";

  return (
    <Card
      variant={variant}
      className={cn("transition-opacity", isPending && "opacity-50")}
    >
      {/* Header: date + description */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={16} className="text-medieval-gold shrink-0" />
            <span className="font-cinzel text-medieval-dark text-sm font-semibold capitalize">
              {dateStr}
            </span>
          </div>
          {quedada.description && (
            <p className="font-garamond text-medieval-dark text-sm ml-6">
              {quedada.description}
            </p>
          )}
          <p className="font-garamond text-medieval-stone text-xs ml-6 mt-0.5">
            Proposada per{" "}
            <span className="font-semibold">
              {quedada.creator?.name ?? "Desconegut"}
            </span>
          </p>
        </div>

        {/* Status badge */}
        <span
          className={cn(
            "shrink-0 px-2 py-0.5 rounded-full font-cinzel text-xs font-semibold",
            quedada.status === "confirmed" &&
              "bg-medieval-green/20 text-medieval-green",
            quedada.status === "rejected" &&
              "bg-medieval-burgundy/20 text-medieval-burgundy",
            quedada.status === "pending" &&
              "bg-medieval-gold/20 text-medieval-dark"
          )}
        >
          {quedada.status === "confirmed" && "Confirmada"}
          {quedada.status === "rejected" && "Rebutjada"}
          {quedada.status === "pending" &&
            `${confirmedCount}/${totalCount} confirmats`}
        </span>
      </div>

      {/* Participants */}
      <div className="flex flex-wrap gap-2 mb-3">
        {quedada.participants?.map((p) => (
          <div
            key={p.id}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-medieval border text-xs font-garamond",
              p.status === "confirmed" &&
                "bg-medieval-green/10 border-medieval-green/30 text-medieval-green",
              p.status === "rejected" &&
                "bg-medieval-burgundy/10 border-medieval-burgundy/30 text-medieval-burgundy",
              p.status === "pending" &&
                "bg-parchment-light border-medieval-brown/20 text-medieval-stone"
            )}
          >
            <MeepleIcon
              color={p.player?.color ?? "#8B4513"}
              size={14}
              name={p.player?.name}
            />
            <span>{p.player?.name}</span>
            {p.status === "confirmed" && <Check size={10} />}
            {p.status === "rejected" && <X size={10} />}
            {p.status === "pending" && <Clock size={10} />}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {needsMyResponse && (
          <>
            <button
              onClick={() => handleRespond("confirmed")}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-medieval border-2 border-medieval-green/40 bg-medieval-green/10 text-medieval-green hover:bg-medieval-green/20 font-cinzel text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Check size={14} />
              Confirmar
            </button>
            <button
              onClick={() => handleRespond("rejected")}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-medieval border-2 border-medieval-burgundy/40 bg-medieval-burgundy/10 text-medieval-burgundy hover:bg-medieval-burgundy/20 font-cinzel text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <X size={14} />
              Rebutjar
            </button>
          </>
        )}

        {isCreator && (
          <div className="ml-auto">
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
      </div>
    </Card>
  );
}
