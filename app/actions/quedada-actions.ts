"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendPushToPlayer, sendPushToAll } from "@/lib/push/send";
import type { Quedada } from "@/types";

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

  if (error) throw new Error(error.message);
  return (data as Quedada[]) ?? [];
}

export async function createQuedada(
  date: string,
  participantIds: string[],
  description?: string
) {
  if (participantIds.length < 2)
    return { error: "Cal seleccionar almenys 2 participants." };

  const supabase = await createClient();
  const creatorId = await getCurrentPlayerId(supabase);
  if (!creatorId) return { error: "No s'ha pogut identificar l'usuari." };

  if (!participantIds.includes(creatorId)) {
    participantIds = [creatorId, ...participantIds];
  }

  // Create the quedada
  const { data: quedada, error } = await supabase
    .from("quedadas")
    .insert({
      date,
      description: description?.trim() || null,
      created_by: creatorId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Insert participants — creator is auto-confirmed
  const participants = participantIds.map((pid) => ({
    quedada_id: quedada.id,
    player_id: pid,
    status: pid === creatorId ? "confirmed" : "pending",
    responded_at: pid === creatorId ? new Date().toISOString() : null,
  }));

  const { error: pError } = await supabase
    .from("quedada_participants")
    .insert(participants);

  if (pError) return { error: pError.message };

  // Send push notifications to non-creator participants
  const creatorName = await getCurrentPlayerName(supabase);
  const dateStr = new Date(date).toLocaleDateString("ca-ES", {
    day: "numeric",
    month: "long",
  });

  for (const pid of participantIds) {
    if (pid === creatorId) continue;
    await sendPushToPlayer(pid, {
      title: "Nova quedada!",
      body: `${creatorName ?? "Algú"} proposa quedar el ${dateStr}. Confirma la teva assistència!`,
      url: "/plans/quedades",
      tag: `quedada-${quedada.id}`,
    });
  }

  revalidatePath("/plans");
  return { error: null, id: quedada.id };
}

export async function respondToQuedada(
  quedadaId: string,
  response: "confirmed" | "rejected"
) {
  const supabase = await createClient();
  const playerId = await getCurrentPlayerId(supabase);
  if (!playerId) return { error: "No s'ha pogut identificar l'usuari." };

  const { error } = await supabase
    .from("quedada_participants")
    .update({
      status: response,
      responded_at: new Date().toISOString(),
    })
    .eq("quedada_id", quedadaId)
    .eq("player_id", playerId);

  if (error) return { error: error.message };

  // Notify all about the response
  const playerName = await getCurrentPlayerName(supabase);
  const statusText = response === "confirmed" ? "ha confirmat" : "ha rebutjat";
  await sendPushToAll({
    title: "Resposta a quedada",
    body: `${playerName ?? "Algú"} ${statusText} la quedada.`,
    url: "/plans/quedades",
    tag: `quedada-${quedadaId}`,
  });

  revalidatePath("/plans");
  return { error: null };
}

export async function deleteQuedada(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("quedadas").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/plans");
  return { error: null };
}

export async function getPendingQuedadasForPlayer(): Promise<
  { quedadaId: string; date: string; creatorName: string }[]
> {
  const supabase = await createClient();
  const playerId = await getCurrentPlayerId(supabase);
  if (!playerId) return [];

  const { data, error } = await supabase
    .from("quedada_participants")
    .select("quedada_id, quedadas(date, creator:players!quedadas_created_by_fkey(name))")
    .eq("player_id", playerId)
    .eq("status", "pending");

  if (error || !data) return [];

  return data.map((d) => {
    const q = d.quedadas as unknown as {
      date: string;
      creator: { name: string };
    };
    return {
      quedadaId: d.quedada_id,
      date: q.date,
      creatorName: q.creator?.name ?? "Desconegut",
    };
  });
}
