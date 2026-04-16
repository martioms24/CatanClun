"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MeepleIcon } from "@/components/ui/MeepleIcon";
import { redeemReward } from "@/app/actions/reward-actions";
import { REWARDS_CATALOG } from "@/lib/rewards-catalog";
import { cn } from "@/lib/utils";
import type { Player, RewardType } from "@/types";
import { Coins, Check, X, ShoppingCart } from "lucide-react";

export function RewardsCatalog({
  players,
  currentPlayerId,
  currentBalance,
}: {
  players: Player[];
  currentPlayerId: string | null;
  currentBalance: number;
}) {
  const [selectedReward, setSelectedReward] = useState<RewardType | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reward = REWARDS_CATALOG.find((r) => r.type === selectedReward);
  const otherPlayers = players.filter((p) => p.id !== currentPlayerId);

  function handleRedeem() {
    if (!selectedReward || !reward) return;
    setError(null);

    if (reward.needsTarget && !targetId) {
      setError("Has de triar un jugador.");
      return;
    }
    if (reward.needsDescription && !description.trim()) {
      setError("Has de descriure el ball de TikTok.");
      return;
    }

    startTransition(async () => {
      const result = await redeemReward(
        selectedReward,
        targetId,
        description || null
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setSelectedReward(null);
      setTargetId(null);
      setDescription("");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {REWARDS_CATALOG.map((r) => {
        const canAfford = currentBalance >= r.cost;
        const isSelected = selectedReward === r.type;

        return (
          <Card
            key={r.type}
            variant={isSelected ? "gold" : "parchment"}
            className={cn(
              "transition-all",
              !canAfford && !isSelected && "opacity-60"
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl shrink-0">{r.emoji}</span>
              <div className="flex-1">
                <h3 className="font-cinzel text-medieval-dark text-base font-bold">
                  {r.label}
                </h3>
                <p className="font-garamond text-medieval-stone text-sm">
                  {r.description}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-1">
                  <Coins size={14} className="text-medieval-gold" />
                  <span className="font-cinzel text-medieval-gold font-bold text-lg">
                    {r.cost}
                  </span>
                </div>
                {!isSelected ? (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!canAfford}
                    onClick={() => {
                      setSelectedReward(r.type);
                      setTargetId(null);
                      setDescription("");
                      setError(null);
                    }}
                  >
                    <ShoppingCart size={12} />
                    Canviar
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedReward(null)}
                  >
                    <X size={12} />
                    Cancel·lar
                  </Button>
                )}
              </div>
            </div>

            {/* Redeem form */}
            {isSelected && reward && (
              <div className="mt-3 pt-3 border-t border-medieval-gold/30 flex flex-col gap-3">
                {reward.needsTarget && (
                  <div>
                    <label className="font-garamond text-medieval-stone text-sm mb-1.5 block">
                      Qui et deu {reward.label.toLowerCase()}?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {otherPlayers.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setTargetId(p.id)}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-medieval border-2 text-sm font-garamond transition-all",
                            targetId === p.id
                              ? "bg-medieval-gold/20 border-medieval-gold text-medieval-dark font-semibold"
                              : "bg-parchment-light border-medieval-brown/20 text-medieval-stone hover:border-medieval-brown/40"
                          )}
                        >
                          <MeepleIcon
                            color={p.color}
                            size={16}
                            name={p.name}
                          />
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {reward.needsDescription && (
                  <div>
                    <label className="font-garamond text-medieval-stone text-sm mb-1 block">
                      Quin ball de TikTok ha de fer?
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descriu el ball..."
                      maxLength={200}
                      className="w-full px-3 py-2 rounded-medieval border-2 border-medieval-brown/30 bg-parchment-light font-garamond text-medieval-dark text-sm focus:outline-none focus:border-medieval-gold transition-colors"
                    />
                  </div>
                )}

                {error && (
                  <p className="font-garamond text-red-700 text-sm">
                    {error}
                  </p>
                )}

                <Button
                  variant="primary"
                  size="sm"
                  loading={isPending}
                  onClick={handleRedeem}
                  className="w-full sm:w-auto"
                >
                  <Check size={14} />
                  Confirmar canvi ({reward.cost} pts)
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
