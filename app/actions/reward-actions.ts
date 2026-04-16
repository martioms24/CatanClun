"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendPushToPlayer, sendPushToAll } from "@/lib/push/send";
import { REWARDS_CATALOG } from "@/lib/rewards-catalog";
import type { Redemption, RewardType } from "@/types";

async function getCurrentPlayerId(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("players")
    .select("id")
    .eq("user_id", user.id)
    .single();
  return data?.id ?? null;
}

async function getCurrentPlayerName(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("players")
    .select("name")
    .eq("user_id", user.id)
    .single();
  return data?.name ?? null;
}

export async function getRedemptions(): Promise<Redemption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("redemptions")
    .select(
      "*, redeemer:players!redemptions_redeemed_by_fkey(*), target:players!redemptions_target_player_fkey(*)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[rewards] getRedemptions error:", error.message);
    return [];
  }
  return (data as Redemption[]) ?? [];
}

export async function redeemReward(
  rewardType: RewardType,
  targetPlayerId: string | null,
  description: string | null
) {
  const reward = REWARDS_CATALOG.find((r) => r.type === rewardType);
  if (!reward) return { error: "Recompensa no trobada." };

  if (reward.needsTarget && !targetPlayerId)
    return { error: "Has de triar un jugador." };
  if (reward.needsDescription && !description?.trim())
    return { error: "Has de descriure el ball." };

  const supabase = await createClient();
  const playerId = await getCurrentPlayerId(supabase);
  if (!playerId) return { error: "No s'ha pogut identificar l'usuari." };

  if (targetPlayerId === playerId)
    return { error: "No et pots triar a tu mateix!" };

  // Check balance — import the calculation logic
  const { getPlayerBalance } = await import("./gambling-actions");
  const balance = await getPlayerBalance(playerId);
  if (balance < reward.cost)
    return { error: `No tens prou punts. Saldo: ${balance}, cost: ${reward.cost}` };

  const { error } = await supabase.from("redemptions").insert({
    reward_type: rewardType,
    cost: reward.cost,
    redeemed_by: playerId,
    target_player: targetPlayerId || null,
    description: description?.trim() || null,
  });

  if (error) return { error: error.message };

  // Notify
  const playerName = await getCurrentPlayerName(supabase);
  if (targetPlayerId) {
    const descText =
      rewardType === "tiktok"
        ? ` Ball: ${description?.trim()}`
        : "";
    await sendPushToPlayer(targetPlayerId, {
      title: `${reward.emoji} ${reward.label}!`,
      body: `${playerName ?? "Algú"} ha canviat punts: li deus ${reward.label.toLowerCase()}!${descText}`,
      url: "/rewards",
      tag: `reward-${rewardType}`,
    });
  } else {
    await sendPushToAll({
      title: `${reward.emoji} ${reward.label}!`,
      body: `${playerName ?? "Algú"} ha canviat ${reward.cost} punts: el grup l'ha de convidar a ${reward.label.toLowerCase()}!`,
      url: "/rewards",
      tag: `reward-${rewardType}`,
    });
  }

  revalidatePath("/rewards");
  revalidatePath("/forum");
  revalidatePath("/gambling");
  return { error: null };
}

export async function markRedemptionCompleted(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("redemptions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/rewards");
  return { error: null };
}
