"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ForumPost } from "@/types";

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

export async function getForumPosts(): Promise<ForumPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("forum_posts")
    .select("*, author:players!forum_posts_author_id_fkey(*)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[forum] getForumPosts error:", error.message);
    return [];
  }
  return (data as ForumPost[]) ?? [];
}

export async function createForumPost(title: string, body: string) {
  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();
  if (!trimmedTitle) return { error: "El títol no pot estar buit." };
  if (!trimmedBody) return { error: "El missatge no pot estar buit." };
  if (trimmedTitle.length > 100) return { error: "El títol és massa llarg (màx. 100)." };
  if (trimmedBody.length > 300) return { error: "El missatge és massa llarg (màx. 300)." };

  const supabase = await createClient();
  const authorId = await getCurrentPlayerId(supabase);
  if (!authorId) return { error: "No s'ha pogut identificar l'usuari." };

  const { error } = await supabase.from("forum_posts").insert({
    title: trimmedTitle,
    body: trimmedBody,
    author_id: authorId,
  });

  if (error) return { error: error.message };

  revalidatePath("/forum");
  return { error: null };
}

export async function deleteForumPost(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("forum_posts").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/forum");
  return { error: null };
}
