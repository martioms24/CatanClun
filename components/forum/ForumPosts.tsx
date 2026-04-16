"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MeepleIcon } from "@/components/ui/MeepleIcon";
import { createForumPost, deleteForumPost } from "@/app/actions/forum-post-actions";
import type { ForumPost } from "@/types";
import { PlusCircle, Check, X, Trash2, MessageCircle } from "lucide-react";

export function ForumPosts({
  posts,
  currentPlayerId,
}: {
  posts: ForumPost[];
  currentPlayerId: string | null;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createForumPost(title, body);
      if (result.error) {
        setError(result.error);
        return;
      }
      setTitle("");
      setBody("");
      setAdding(false);
    });
  }

  function handleDelete(id: string) {
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 4000);
      return;
    }
    setDeletingId(null);
    startTransition(async () => {
      await deleteForumPost(id);
    });
  }

  return (
    <div>
      {/* New post button / form */}
      <div className="mb-4">
        {!adding ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setAdding(true)}
            className="w-full"
          >
            <PlusCircle size={14} />
            Publicar missatge
          </Button>
        ) : (
          <Card>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Títol"
                autoFocus
                maxLength={100}
                className="w-full px-3 py-2 rounded-medieval border-2 border-medieval-brown/30 bg-parchment-light font-cinzel text-medieval-dark text-sm focus:outline-none focus:border-medieval-gold transition-colors"
              />
              <div className="relative">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Què vols dir?"
                  maxLength={300}
                  rows={3}
                  className="w-full px-3 py-2 rounded-medieval border-2 border-medieval-brown/30 bg-parchment-light font-garamond text-medieval-dark text-sm focus:outline-none focus:border-medieval-gold transition-colors resize-none"
                />
                <span className="absolute bottom-2 right-2 font-garamond text-medieval-stone text-xs">
                  {body.length}/300
                </span>
              </div>
              {error && (
                <p className="font-garamond text-red-700 text-sm">{error}</p>
              )}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isPending}
                  disabled={!title.trim() || !body.trim()}
                >
                  <Check size={14} />
                  Publicar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAdding(false);
                    setTitle("");
                    setBody("");
                    setError(null);
                  }}
                >
                  <X size={14} />
                  Cancel·lar
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>

      {/* Posts list */}
      {posts.length === 0 ? (
        <div className="text-center py-6 text-medieval-stone font-garamond">
          <MessageCircle size={28} className="mx-auto mb-2 opacity-30" />
          <p>Cap missatge encara. Sigues el primer!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {posts.map((post) => {
            const timeAgo = getTimeAgo(post.created_at);
            const isAuthor = post.author_id === currentPlayerId;

            return (
              <div
                key={post.id}
                className="p-3 rounded-medieval border border-medieval-brown/20 bg-parchment"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <MeepleIcon
                    color={post.author?.color ?? "#8B4513"}
                    size={16}
                    name={post.author?.name}
                  />
                  <span className="font-cinzel text-medieval-dark text-xs font-semibold">
                    {post.author?.name ?? "Desconegut"}
                  </span>
                  <span className="font-garamond text-medieval-stone text-xs ml-auto">
                    {timeAgo}
                  </span>
                  {isAuthor && (
                    deletingId === post.id ? (
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={isPending}
                        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-medieval border border-red-900 bg-medieval-burgundy text-parchment font-cinzel text-[10px] font-semibold animate-pulse"
                      >
                        <Trash2 size={10} />
                        Segur?
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={isPending}
                        className="p-1 text-medieval-stone/40 hover:text-medieval-burgundy transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    )
                  )}
                </div>
                <p className="font-cinzel text-medieval-dark text-sm font-semibold leading-tight">
                  {post.title}
                </p>
                <p className="font-garamond text-medieval-dark text-sm mt-1 whitespace-pre-line break-words">
                  {post.body}
                </p>
              </div>
            );
          })}
        </div>
      )}
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
