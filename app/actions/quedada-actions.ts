"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendPushToAll } from "@/lib/push/send";
import { QUEDADA_TYPES } from "@/lib/quedada-types";
import type { Quedada, QuedadaType } from "@/types";

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

export async function getQuedadas(): Promise<Quedada[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quedadas")
    .select(
      `*, creator:players!quedadas_created_by_fkey(*), participants:quedada_participants(*, player:players(*))`
    )
    .order("date", { ascending: false });

  if (error) {
    console.error("[quedadas] getQuedadas error:", error.message);
    return [];
  }
  return (data as Quedada[]) ?? [];
}

export async function createQuedada(
  date: string,
  participantIds: string[],
  type: QuedadaType,
  points: number,
  description?: string
) {
  if (participantIds.length < 1)
    return { error: "Cal seleccionar almenys 1 participant." };

  const supabase = await createClient();
  const creatorId = await getCurrentPlayerId(supabase);
  if (!creatorId) return { error: "No s'ha pogut identificar l'usuari." };

  if (!participantIds.includes(creatorId)) {
    participantIds = [creatorId, ...participantIds];
  }

  // Resolve points from type if not custom
  const typeInfo = QUEDADA_TYPES.find((t) => t.type === type);
  const finalPoints = type === "custom" ? points : (typeInfo?.points ?? 4);

  const { data: quedada, error } = await supabase
    .from("quedadas")
    .insert({
      date,
      description: description?.trim() || null,
      created_by: creatorId,
      status: "confirmed",
      type,
      points: finalPoints,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Insert participants (all confirmed — no approval)
  const participants = participantIds.map((pid) => ({
    quedada_id: quedada.id,
    player_id: pid,
    status: "confirmed",
    responded_at: new Date().toISOString(),
  }));

  const { error: pError } = await supabase
    .from("quedada_participants")
    .insert(participants);

  if (pError) return { error: pError.message };

  // Push notification
  const creatorName = await getCurrentPlayerName(supabase);
  const dateStr = new Date(date).toLocaleDateString("ca-ES", {
    day: "numeric",
    month: "long",
  });
  const typeLabel = typeInfo?.emoji ?? "";

  await sendPushToAll({
    title: `${typeLabel} Nova quedada registrada!`,
    body: `${creatorName ?? "Algú"} ha registrat una quedada el ${dateStr}`,
    url: "/plans/quedades",
    tag: `quedada-${quedada.id}`,
  });

  revalidatePath("/plans");
  revalidatePath("/forum");
  revalidatePath("/gambling");
  return { error: null, id: quedada.id };
}

/** Auto-register a quedada from a game or cim completion (no push, internal use) */
export async function createAutoQuedada(
  date: string,
  participantIds: string[],
  creatorId: string,
  description?: string
) {
  const supabase = await createClient();

  const { data: quedada, error } = await supabase
    .from("quedadas")
    .insert({
      date,
      description: description || null,
      created_by: creatorId,
      status: "confirmed",
      type: "default",
      points: 4,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[quedada] auto-create error:", error.message);
    return;
  }

  const participants = participantIds.map((pid) => ({
    quedada_id: quedada.id,
    player_id: pid,
    status: "confirmed",
    responded_at: new Date().toISOString(),
  }));

  await supabase.from("quedada_participants").insert(participants);
}

export async function updateQuedada(
  id: string,
  date: string,
  type: QuedadaType,
  points: number,
  description: string | undefined,
  participantIds: string[]
) {
  if (participantIds.length < 1)
    return { error: "Cal almenys 1 participant." };

  const supabase = await createClient();

  const typeInfo = QUEDADA_TYPES.find((t) => t.type === type);
  const finalPoints = type === "custom" ? points : (typeInfo?.points ?? 4);

  const { error: updateErr } = await supabase
    .from("quedadas")
    .update({
      date,
      description: description?.trim() || null,
      type,
      points: finalPoints,
    })
    .eq("id", id);

  if (updateErr) return { error: updateErr.message };

  // Get current participants
  const { data: currentParticipants } = await supabase
    .from("quedada_participants")
    .select("player_id")
    .eq("quedada_id", id);

  const currentIds = new Set(
    currentParticipants?.map((p) => p.player_id) ?? []
  );

  // Add new participants
  const newIds = participantIds.filter((pid) => !currentIds.has(pid));
  if (newIds.length > 0) {
    await supabase.from("quedada_participants").insert(
      newIds.map((pid) => ({
        quedada_id: id,
        player_id: pid,
        status: "confirmed",
        responded_at: new Date().toISOString(),
      }))
    );
  }

  // Remove participants no longer in the list
  const removedIds = [...currentIds].filter(
    (pid) => !participantIds.includes(pid)
  );
  if (removedIds.length > 0) {
    await supabase
      .from("quedada_participants")
      .delete()
      .eq("quedada_id", id)
      .in("player_id", removedIds);
  }

  revalidatePath("/plans");
  revalidatePath("/forum");
  revalidatePath("/gambling");
  return { error: null };
}

export async function deleteQuedada(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("quedadas").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/plans");
  revalidatePath("/gambling");
  return { error: null };
}
