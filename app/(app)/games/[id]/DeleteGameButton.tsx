"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteGame } from "@/app/actions/game-actions";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";

export function DeleteGameButton({ gameId }: { gameId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }

    startTransition(async () => {
      const result = await deleteGame(gameId);
      if (!result.error) {
        router.push("/games");
      }
    });
  }

  return (
    <Button
      variant="danger"
      size="sm"
      onClick={handleDelete}
      loading={isPending}
    >
      <Trash2 size={14} />
      {confirming ? "Confirm?" : "Delete"}
    </Button>
  );
}
