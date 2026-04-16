"use client";

import { useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { MeepleIcon } from "@/components/ui/MeepleIcon";
import { markRedemptionCompleted } from "@/app/actions/reward-actions";
import { REWARDS_CATALOG } from "@/lib/rewards-catalog";
import { cn } from "@/lib/utils";
import type { Redemption } from "@/types";
import { Check, Gift } from "lucide-react";

export function RedemptionLog({
  redemptions,
  currentPlayerId,
}: {
  redemptions: Redemption[];
  currentPlayerId: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  if (redemptions.length === 0) {
    return (
      <div className="text-center py-6 text-medieval-stone font-garamond">
        <Gift size={28} className="mx-auto mb-2 opacity-30" />
        <p>Encara ningú ha canviat punts.</p>
      </div>
    );
  }

  function handleComplete(id: string) {
    startTransition(async () => {
      await markRedemptionCompleted(id);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {redemptions.map((r) => {
        const reward = REWARDS_CATALOG.find((c) => c.type === r.reward_type);
        const isTarget = r.target_player === currentPlayerId;
        const isRedeemer = r.redeemed_by === currentPlayerId;
        const timeAgo = getTimeAgo(r.created_at);

        return (
          <div
            key={r.id}
            className={cn(
              "p-3 rounded-medieval border transition-opacity",
              r.status === "completed"
                ? "border-medieval-green/30 bg-medieval-green/5"
                : "border-medieval-gold/30 bg-medieval-gold/5",
              isPending && "opacity-50"
            )}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">
                {reward?.emoji ?? "\uD83C\uDF81"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <MeepleIcon
                    color={r.redeemer?.color ?? "#8B4513"}
                    size={14}
                    name={r.redeemer?.name}
                  />
                  <span className="font-cinzel text-medieval-dark text-sm font-semibold">
                    {r.redeemer?.name}
                  </span>
                  <span className="font-garamond text-medieval-stone text-xs">
                    ha canviat {reward?.label ?? r.reward_type}
                  </span>
                  {r.target && (
                    <>
                      <span className="font-garamond text-medieval-stone text-xs">
                        {"\u2192"}
                      </span>
                      <MeepleIcon
                        color={r.target.color}
                        size={14}
                        name={r.target.name}
                      />
                      <span className="font-cinzel text-medieval-dark text-xs font-semibold">
                        {r.target.name}
                      </span>
                    </>
                  )}
                </div>
                {r.description && (
                  <p className="font-garamond text-medieval-dark text-sm mt-1 italic">
                    &ldquo;{r.description}&rdquo;
                  </p>
                )}
                <p className="font-garamond text-medieval-stone text-xs mt-0.5">
                  {timeAgo}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                {r.status === "completed" ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-medieval-green/20 text-medieval-green font-cinzel text-xs font-semibold">
                    <Check size={10} />
                    Fet
                  </span>
                ) : (
                  <>
                    <span className="px-2 py-0.5 rounded-full bg-medieval-gold/20 text-medieval-gold font-cinzel text-xs font-semibold">
                      Pendent
                    </span>
                    {(isTarget || isRedeemer) && (
                      <button
                        onClick={() => handleComplete(r.id)}
                        disabled={isPending}
                        className="flex items-center gap-1 px-2 py-1 rounded-medieval border border-medieval-green/40 bg-medieval-green/10 text-medieval-green hover:bg-medieval-green/20 font-cinzel text-xs font-semibold transition-colors disabled:opacity-50 mt-1"
                      >
                        <Check size={10} />
                        Marcar fet
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ara";
  if (mins < 60) return `fa ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `fa ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `fa ${days}d`;
  return new Date(dateStr).toLocaleDateString("ca-ES", {
    day: "numeric",
    month: "short",
  });
}
