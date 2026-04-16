"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendPushToAll } from "@/lib/push/send";
import type { Plan, PlanStatus } from "@/types";

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

export async function getPlans(): Promise<Plan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addPlan(title: string) {
  const trimmed = title.trim();
  if (!trimmed) return { error: "El títol no pot estar buit." };
  if (trimmed.length > 200) return { error: "El títol és massa llarg." };

  const supabase = await createClient();
  const { error } = await supabase.from("plans").insert({ title: trimmed });
  if (error) return { error: error.message };

  const author = await getCurrentPlayerName(supabase);
  await sendPushToAll({
    title: "Nou pla afegit",
    body: author ? `${author}: ${trimmed}` : trimmed,
    url: "/plans",
    tag: "plans",
  });

  revalidatePath("/plans", "layout");
  return { error: null };
}

export async function updatePlanStatus(id: string, status: PlanStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("plans")
    .update({ status })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/plans", "layout");
  return { error: null };
}

export async function deletePlan(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("plans").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/plans", "layout");
  return { error: null };
}
