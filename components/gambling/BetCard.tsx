"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MeepleIcon } from "@/components/ui/MeepleIcon";
import {
  placeBet,
  closeBet,
  resolveBet,
  deleteBet,
  editBet,
} from "@/app/actions/gambling-actions";
import { cn } from "@/lib/utils";
import type { Bet, BetOption } from "@/types";
import {
  Check,
  Lock,
  Trophy,
  Trash2,
  Coins,
  Crown,
  Pencil,
  X,
  Plus,
  Minus,
} from "lucide-react";

export function BetCard({
  bet,
  currentPlayerId,
  currentBalance,
}: {
  bet: Bet;
  currentPlayerId: string | null;
  currentBalance: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [wagerAmounts, setWagerAmounts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [resolveMode, setResolveMode] = useState(false);
  const [selectedWinners, setSelectedWinners] = useState<Set<string>>(new Set());
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(bet.title);
  const [editOptions, setEditOptions] = useState<{ id?: string; label: string }[]>(
    (bet.options ?? []).map((o) => ({ id: o.id, label: o.label }))
  );

  const isCreator = bet.created_by === currentPlayerId;
  const numOptions = bet.options?.length ?? 2;
  const totalPot = bet.wagers?.reduce((sum, w) => sum + w.amount, 0) ?? 0;

  // Group wagers by option
  const wagersByOption: Record<string, typeof bet.wagers> = {};
  for (const opt of bet.options ?? []) {
    wagersByOption[opt.id] =
      bet.wagers?.filter((w) => w.option_id === opt.id) ?? [];
  }

  // My wagers
  const myWagers =
    bet.wagers?.filter((w) => w.player_id === currentPlayerId) ?? [];

  // Detect winner options: winning_option_id OR any option where a wager has payout > 0
  function isWinnerOption(optId: string): boolean {
    if (bet.status !== "resolved") return false;
    if (bet.winning_option_id === optId) return true;
    return (wagersByOption[optId] ?? []).some((w) => w.payout > 0);
  }

  function handleWager(optionId: string) {
    const amountStr = wagerAmounts[optionId];
    const amount = parseInt(amountStr, 10);
    if (!amount || amount <= 0) {
      setError("Introdueix una quantitat vàlida.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await placeBet(bet.id, optionId, amount);
      if (result.error) setError(result.error);
      else {
        setWagerAmounts((prev) => ({ ...prev, [optionId]: "" }));
        router.refresh();
      }
    });
  }

  function handleClose() {
    startTransition(async () => {
      const result = await closeBet(bet.id);
      if (result.error) setError(result.error ?? null);
      else router.refresh();
    });
  }

  function toggleWinner(optionId: string) {
    setSelectedWinners((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) next.delete(optionId);
      else next.add(optionId);
      return next;
    });
  }

  function handleResolve() {
    if (selectedWinners.size === 0) {
      setError("Selecciona almenys una opció guanyadora.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await resolveBet(bet.id, Array.from(selectedWinners));
      if (result.error) setError(result.error);
      else {
        setResolveMode(false);
        router.refresh();
      }
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
      await deleteBet(bet.id);
      router.refresh();
    });
  }

  // ── Edit handlers ──
  function addEditOption() {
    if (editOptions.length >= 10) return;
    setEditOptions([...editOptions, { label: "" }]);
  }

  function removeEditOption(index: number) {
    if (editOptions.length <= 2) return;
    setEditOptions(editOptions.filter((_, i) => i !== index));
  }

  function handleSaveEdit() {
    setError(null);
    startTransition(async () => {
      const result = await editBet(bet.id, editTitle, editOptions);
      if (result.error) setError(result.error);
      else {
        setEditMode(false);
        router.refresh();
      }
    });
  }

  const variant =
    bet.status === "resolved"
      ? "gold"
      : bet.status === "closed"
      ? "stone"
      : "parchment";

  // ── Edit mode ──
  if (editMode) {
    return (
      <Card variant="parchment" className="transition-opacity">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-cinzel text-medieval-dark text-sm font-bold">
              Editar aposta
            </span>
            <button
              onClick={() => {
                setEditMode(false);
                setEditTitle(bet.title);
                setEditOptions((bet.options ?? []).map((o) => ({ id: o.id, label: o.label })));
                setError(null);
              }}
              className="p-1 text-medieval-stone hover:text-medieval-burgundy"
            >
              <X size={16} />
            </button>
          </div>

          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            maxLength={200}
            className="w-full px-3 py-2 rounded-medieval border-2 border-medieval-brown/30 bg-parchment-light font-garamond text-medieval-dark focus:outline-none focus:border-medieval-gold transition-colors"
          />

          <div className="flex flex-col gap-2">
            {editOptions.map((opt, i) => {
              const hasWagers = opt.id
                ? (wagersByOption[opt.id] ?? []).length > 0
                : false;
              return (
                <div key={opt.id ?? `new-${i}`} className="flex items-center gap-2">
                  <span className="font-cinzel text-medieval-stone text-xs w-5 text-center shrink-0">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    value={opt.label}
                    onChange={(e) => {
                      const next = [...editOptions];
                      next[i] = { ...next[i], label: e.target.value };
                      setEditOptions(next);
                    }}
                    placeholder={`Opció ${i + 1}`}
                    maxLength={100}
                    className="flex-1 px-3 py-1.5 rounded-medieval border-2 border-medieval-brown/30 bg-parchment-light font-garamond text-medieval-dark focus:outline-none focus:border-medieval-gold transition-colors text-sm"
                  />
                  {editOptions.length > 2 && !hasWagers && (
                    <button
                      type="button"
                      onClick={() => removeEditOption(i)}
                      className="p-1 text-medieval-stone hover:text-medieval-burgundy transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                  )}
                  {hasWagers && (
                    <span className="text-medieval-stone text-[10px] font-garamond">
                      (amb apostes)
                    </span>
                  )}
                </div>
              );
            })}
            {editOptions.length < 10 && (
              <button
                type="button"
                onClick={addEditOption}
                className="flex items-center gap-1 font-garamond text-medieval-gold text-sm hover:underline"
              >
                <Plus size={12} />
                Afegir opció
              </button>
            )}
          </div>

          {error && <p className="font-garamond text-red-700 text-sm">{error}</p>}

          <div className="flex gap-2">
            <Button
              onClick={handleSaveEdit}
              variant="primary"
              size="sm"
              loading={isPending}
            >
              <Check size={14} />
              Desar
            </Button>
            <Button
              onClick={() => {
                setEditMode(false);
                setError(null);
              }}
              variant="ghost"
              size="sm"
            >
              Cancel·lar
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      variant={variant}
      className={cn("transition-opacity", isPending && "opacity-50")}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <h3 className="font-cinzel text-medieval-dark text-base font-bold">
            {bet.title}
          </h3>
          <p className="font-garamond text-medieval-stone text-xs mt-0.5">
            Per {bet.creator?.name ?? "Desconegut"} &middot; x{numOptions}{" "}
            multiplicador &middot;{" "}
            <Coins size={10} className="inline" /> {totalPot} al pot
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {isCreator && bet.status === "open" && (
            <button
              onClick={() => setEditMode(true)}
              className="p-1.5 rounded-medieval border border-medieval-blue/40 bg-medieval-blue/10 text-medieval-blue hover:bg-medieval-blue/20 transition-colors"
              title="Editar"
            >
              <Pencil size={12} />
            </button>
          )}
          <span
            className={cn(
              "shrink-0 px-2 py-0.5 rounded-full font-cinzel text-xs font-semibold",
              bet.status === "open" &&
                "bg-medieval-green/20 text-medieval-green",
              bet.status === "closed" &&
                "bg-medieval-stone/20 text-medieval-stone",
              bet.status === "resolved" &&
                "bg-medieval-gold/20 text-medieval-gold"
            )}
          >
            {bet.status === "open" && "Oberta"}
            {bet.status === "closed" && "Tancada"}
            {bet.status === "resolved" && "Resolta"}
          </span>
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2 mb-3">
        {(bet.options ?? []).map((opt: BetOption) => {
          const optionWagers = wagersByOption[opt.id] ?? [];
          const optionTotal = optionWagers.reduce((s, w) => s + w.amount, 0);
          const isWinner = isWinnerOption(opt.id);
          const myWagerOnThis = myWagers.find((w) => w.option_id === opt.id);
          const isSelectedWinner = selectedWinners.has(opt.id);

          return (
            <div
              key={opt.id}
              className={cn(
                "rounded-medieval border-2 p-3 transition-colors",
                isWinner
                  ? "border-medieval-gold bg-medieval-gold/15"
                  : resolveMode && isSelectedWinner
                  ? "border-medieval-green bg-medieval-green/15"
                  : "border-medieval-brown/20 bg-parchment-light"
              )}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {isWinner && (
                  <Crown size={14} className="text-medieval-gold shrink-0" />
                )}

                {/* Resolve mode: checkbox */}
                {resolveMode && (
                  <button
                    onClick={() => toggleWinner(opt.id)}
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                      isSelectedWinner
                        ? "bg-medieval-green border-medieval-green text-white"
                        : "border-medieval-brown/40 hover:border-medieval-green"
                    )}
                  >
                    {isSelectedWinner && <Check size={12} />}
                  </button>
                )}

                <span
                  className={cn(
                    "font-cinzel text-sm font-semibold flex-1",
                    isWinner
                      ? "text-medieval-gold"
                      : "text-medieval-dark"
                  )}
                >
                  {opt.label}
                </span>
                <span className="font-garamond text-medieval-stone text-xs flex items-center gap-1">
                  <Coins size={10} /> {optionTotal}
                </span>
              </div>

              {/* Wagers on this option */}
              {optionWagers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {optionWagers.map((w) => (
                    <span
                      key={w.id}
                      className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-garamond border",
                        isWinner && w.payout > 0
                          ? "bg-medieval-gold/20 border-medieval-gold/40 text-medieval-gold"
                          : "bg-parchment border-medieval-brown/20 text-medieval-stone"
                      )}
                    >
                      <MeepleIcon
                        color={w.player?.color ?? "#8B4513"}
                        size={10}
                        name={w.player?.name}
                      />
                      {w.player?.name}
                      <Coins size={8} />
                      {w.amount}
                      {bet.status === "resolved" && w.payout > 0 && (
                        <span className="text-medieval-green font-semibold">
                          +{w.payout}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}

              {/* Bet input — only if open and not already bet on this option */}
              {bet.status === "open" && !myWagerOnThis && currentPlayerId && !resolveMode && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={currentBalance}
                    value={wagerAmounts[opt.id] ?? ""}
                    onChange={(e) =>
                      setWagerAmounts((prev) => ({
                        ...prev,
                        [opt.id]: e.target.value,
                      }))
                    }
                    placeholder="Punts"
                    className="w-20 px-2 py-1 rounded-medieval border border-medieval-brown/30 bg-parchment-light font-garamond text-medieval-dark text-sm focus:outline-none focus:border-medieval-gold"
                  />
                  <button
                    onClick={() => handleWager(opt.id)}
                    disabled={isPending}
                    className="flex items-center gap-1 px-2 py-1 rounded-medieval border border-medieval-gold/50 bg-medieval-gold/10 text-medieval-gold hover:bg-medieval-gold/20 font-cinzel text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <Coins size={10} />
                    Apostar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p className="font-garamond text-red-700 text-sm mb-2">{error}</p>
      )}

      {/* Resolve mode confirmation */}
      {resolveMode && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-medieval-green/10 rounded-medieval border border-medieval-green/30">
          <span className="font-garamond text-medieval-dark text-sm flex-1">
            Selecciona les opcions guanyadores
          </span>
          <Button
            onClick={handleResolve}
            disabled={isPending || selectedWinners.size === 0}
            loading={isPending}
            size="sm"
            variant="primary"
          >
            <Trophy size={12} />
            Confirmar ({selectedWinners.size})
          </Button>
          <Button
            onClick={() => {
              setResolveMode(false);
              setSelectedWinners(new Set());
              setError(null);
            }}
            size="sm"
            variant="ghost"
          >
            <X size={12} />
          </Button>
        </div>
      )}

      {/* Creator controls */}
      {isCreator && !resolveMode && (
        <div className="flex items-center gap-2 pt-2 border-t border-medieval-brown/20">
          {(bet.status === "open" || bet.status === "closed") && (
            <button
              onClick={() => {
                setResolveMode(true);
                setSelectedWinners(new Set());
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-medieval border border-medieval-green/40 bg-medieval-green/10 text-medieval-green hover:bg-medieval-green/20 font-cinzel text-xs font-semibold transition-colors"
            >
              <Trophy size={10} />
              Resoldre
            </button>
          )}
          {bet.status === "open" && (
            <button
              onClick={handleClose}
              disabled={isPending}
              className="flex items-center gap-1 px-2.5 py-1 rounded-medieval border border-medieval-stone/40 bg-medieval-stone/10 text-medieval-stone hover:bg-medieval-stone/20 font-cinzel text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Lock size={10} />
              Tancar
            </button>
          )}
          {bet.status !== "resolved" &&
            (confirmDelete ? (
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex items-center gap-1 px-2 py-1 rounded-medieval border-2 border-red-900 bg-medieval-burgundy text-parchment font-cinzel text-xs font-semibold transition-colors disabled:opacity-50 animate-pulse ml-auto"
              >
                <Trash2 size={12} />
                Segur?
              </button>
            ) : (
              <button
                onClick={handleDelete}
                disabled={isPending}
                aria-label="Eliminar"
                className="p-1.5 rounded-medieval border border-medieval-burgundy/40 bg-medieval-burgundy/10 text-medieval-burgundy hover:bg-medieval-burgundy/20 transition-colors disabled:opacity-50 ml-auto"
              >
                <Trash2 size={14} />
              </button>
            ))}
        </div>
      )}

      {/* My payout summary (resolved) */}
      {bet.status === "resolved" &&
        myWagers.length > 0 &&
        (() => {
          const totalWagered = myWagers.reduce((s, w) => s + w.amount, 0);
          const totalPayout = myWagers.reduce((s, w) => s + w.payout, 0);
          const net = totalPayout - totalWagered;
          return (
            <div className="mt-2 pt-2 border-t border-medieval-brown/20 flex items-center gap-2">
              <Coins size={14} className="text-medieval-gold" />
              <span className="font-garamond text-sm text-medieval-dark">
                Has apostat{" "}
                <span className="font-semibold">{totalWagered}</span>
              </span>
              <span
                className={cn(
                  "font-cinzel font-bold text-sm",
                  net > 0
                    ? "text-medieval-green"
                    : net < 0
                    ? "text-medieval-burgundy"
                    : "text-medieval-stone"
                )}
              >
                {net > 0 ? `+${net}` : net === 0 ? "±0" : `${net}`}
              </span>
            </div>
          );
        })()}
    </Card>
  );
}
