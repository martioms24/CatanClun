"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { MeepleIcon } from "@/components/ui/MeepleIcon";
import {
  placeBet,
  closeBet,
  resolveBet,
  deleteBet,
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
  const [isPending, startTransition] = useTransition();
  const [wagerAmounts, setWagerAmounts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isCreator = bet.created_by === currentPlayerId;
  const numOptions = bet.options?.length ?? 2;
  const totalPot =
    bet.wagers?.reduce((sum, w) => sum + w.amount, 0) ?? 0;

  // Group wagers by option
  const wagersByOption: Record<string, typeof bet.wagers> = {};
  for (const opt of bet.options ?? []) {
    wagersByOption[opt.id] =
      bet.wagers?.filter((w) => w.option_id === opt.id) ?? [];
  }

  // My wagers
  const myWagers = bet.wagers?.filter(
    (w) => w.player_id === currentPlayerId
  ) ?? [];

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
      else setWagerAmounts((prev) => ({ ...prev, [optionId]: "" }));
    });
  }

  function handleClose() {
    startTransition(async () => {
      await closeBet(bet.id);
    });
  }

  function handleResolve(optionId: string) {
    startTransition(async () => {
      const result = await resolveBet(bet.id, optionId);
      if (result.error) setError(result.error);
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
    });
  }

  const variant =
    bet.status === "resolved"
      ? "gold"
      : bet.status === "closed"
      ? "stone"
      : "parchment";

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

      {/* Options */}
      <div className="flex flex-col gap-2 mb-3">
        {(bet.options ?? []).map((opt: BetOption) => {
          const optionWagers = wagersByOption[opt.id] ?? [];
          const optionTotal = optionWagers.reduce(
            (s, w) => s + w.amount,
            0
          );
          const isWinner = bet.winning_option_id === opt.id;
          const myWagerOnThis = myWagers.find(
            (w) => w.option_id === opt.id
          );

          return (
            <div
              key={opt.id}
              className={cn(
                "rounded-medieval border-2 p-3 transition-colors",
                isWinner
                  ? "border-medieval-gold bg-medieval-gold/15"
                  : "border-medieval-brown/20 bg-parchment-light"
              )}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {isWinner && (
                  <Crown size={14} className="text-medieval-gold shrink-0" />
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
              {bet.status === "open" && !myWagerOnThis && currentPlayerId && (
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

              {/* Resolve button — creator only, when closed */}
              {bet.status === "closed" && isCreator && (
                <button
                  onClick={() => handleResolve(opt.id)}
                  disabled={isPending}
                  className="flex items-center gap-1 px-2 py-1 rounded-medieval border border-medieval-green/40 bg-medieval-green/10 text-medieval-green hover:bg-medieval-green/20 font-cinzel text-xs font-semibold transition-colors disabled:opacity-50 mt-1"
                >
                  <Trophy size={10} />
                  Aquesta ha guanyat
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p className="font-garamond text-red-700 text-sm mb-2">{error}</p>
      )}

      {/* Creator controls */}
      {isCreator && (
        <div className="flex items-center gap-2 pt-2 border-t border-medieval-brown/20">
          {bet.status === "open" && (
            <button
              onClick={handleClose}
              disabled={isPending}
              className="flex items-center gap-1 px-2.5 py-1 rounded-medieval border border-medieval-stone/40 bg-medieval-stone/10 text-medieval-stone hover:bg-medieval-stone/20 font-cinzel text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Lock size={10} />
              Tancar apostes
            </button>
          )}
          {bet.status !== "resolved" && (
            confirmDelete ? (
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
            )
          )}
        </div>
      )}

      {/* My payout summary (resolved) */}
      {bet.status === "resolved" && myWagers.length > 0 && (() => {
        const totalWagered = myWagers.reduce((s, w) => s + w.amount, 0);
        const totalPayout = myWagers.reduce((s, w) => s + w.payout, 0);
        const net = totalPayout - totalWagered;
        return (
          <div className="mt-2 pt-2 border-t border-medieval-brown/20 flex items-center gap-2">
            <Coins size={14} className="text-medieval-gold" />
            <span className="font-garamond text-sm text-medieval-dark">
              Has apostat <span className="font-semibold">{totalWagered}</span>
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
