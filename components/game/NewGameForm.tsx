"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { MeepleIcon } from "@/components/ui/MeepleIcon";
import { useToast } from "@/components/ui/Toast";
import {
  createGame,
  updateGame,
  createCustomExtension,
} from "@/app/actions/game-actions";
import type { Player, Extension, Game } from "@/types";
import { Plus, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewGameFormProps {
  players: Player[];
  extensions: Extension[];
  editingGame?: Game;
}

type PlayerEntry = {
  player_id: string;
  score: string;
  included: boolean;
};

export function NewGameForm({
  players,
  extensions: initialExtensions,
  editingGame,
}: NewGameFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const [playedAt, setPlayedAt] = useState(
    editingGame?.played_at ?? new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState(editingGame?.notes ?? "");

  const [entries, setEntries] = useState<PlayerEntry[]>(() =>
    players.map((p) => {
      const existing = editingGame?.results?.find((r) => r.player_id === p.id);
      return {
        player_id: p.id,
        score: existing?.score?.toString() ?? "",
        included: existing ? true : false,
      };
    })
  );

  const [extensions, setExtensions] = useState<Extension[]>(initialExtensions);
  const [selectedExtIds, setSelectedExtIds] = useState<Set<string>>(
    new Set(editingGame?.extensions?.map((e) => e.id) ?? [])
  );
  const [newExtName, setNewExtName] = useState("");
  const [addingExt, setAddingExt] = useState(false);

  function togglePlayer(playerId: string) {
    setEntries((prev) =>
      prev.map((e) =>
        e.player_id === playerId ? { ...e, included: !e.included } : e
      )
    );
  }

  function setScore(playerId: string, value: string) {
    setEntries((prev) =>
      prev.map((e) =>
        e.player_id === playerId ? { ...e, score: value } : e
      )
    );
  }

  function toggleExt(id: string) {
    setSelectedExtIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAddCustomExt() {
    if (!newExtName.trim()) return;
    setAddingExt(true);
    const result = await createCustomExtension(newExtName.trim());
    if (result.error) {
      showToast({ message: result.error, type: "error" });
    } else if (result.extension) {
      setExtensions((prev) => [...prev, result.extension!]);
      setSelectedExtIds((prev) => new Set([...prev, result.extension!.id]));
      setNewExtName("");
    }
    setAddingExt(false);
  }

  function computePositions(entries: PlayerEntry[]) {
    return entries
      .filter((e) => e.included && e.score !== "")
      .map((e) => ({ player_id: e.player_id, score: parseInt(e.score, 10) }))
      .sort((a, b) => b.score - a.score)
      .map((e, i) => ({ ...e, position: i + 1 }));
  }

  function validate(): string | null {
    const included = entries.filter((e) => e.included);
    if (included.length < 2) return "Selecciona almenys 2 jugadors.";
    for (const e of included) {
      if (e.score === "" || isNaN(parseInt(e.score, 10)))
        return "Entra una puntuació per a cada jugador seleccionat.";
      if (parseInt(e.score, 10) < 0) return "Les puntuacions han de ser ≥ 0.";
    }
    return null;
  }

  function handleSubmit() {
    const err = validate();
    if (err) {
      showToast({ message: err, type: "error" });
      return;
    }

    const results = computePositions(entries);

    startTransition(async () => {
      const payload = {
        played_at: playedAt,
        notes: notes || undefined,
        results,
        extension_ids: Array.from(selectedExtIds),
      };

      const result = editingGame
        ? await updateGame(editingGame.id, payload)
        : await createGame(payload);

      if (result.error) {
        showToast({ message: result.error, type: "error" });
        return;
      }

      showToast({
        message: editingGame ? "Partida actualitzada!" : "Partida desada!",
        type: "success",
      });

      if (!editingGame && "id" in result) {
        router.push(`/games/${result.id}`);
      } else {
        router.push(`/games/${editingGame?.id}`);
      }
    });
  }

  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle>Data de la Partida</CardTitle>
        </CardHeader>
        <Input
          type="date"
          value={playedAt}
          onChange={(e) => setPlayedAt(e.target.value)}
          className="text-base"
        />
      </Card>

      {/* Jugadors i Puntuació */}
      <Card>
        <CardHeader>
          <CardTitle>Jugadors i Puntuació</CardTitle>
        </CardHeader>
        <p className="text-medieval-stone text-sm font-garamond mb-4">
          Activa els jugadors que hi van participar i entra les puntuacions
          finals. Les posicions es calculen automàticament.
        </p>
        <div className="flex flex-col gap-3">
          {entries.map((entry) => {
            const player = playerMap[entry.player_id];
            if (!player) return null;
            return (
              <div
                key={entry.player_id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-medieval border-2 transition-all",
                  entry.included
                    ? "border-medieval-gold bg-medieval-gold/5"
                    : "border-medieval-brown/20 bg-parchment-light/50"
                )}
              >
                <button
                  type="button"
                  onClick={() => togglePlayer(entry.player_id)}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                    entry.included
                      ? "bg-medieval-gold border-medieval-gold text-medieval-dark"
                      : "bg-transparent border-medieval-brown/30 text-transparent"
                  )}
                >
                  <Check size={14} />
                </button>

                <MeepleIcon color={player.color} size={24} />
                <span className="font-cinzel font-semibold text-medieval-dark flex-1 text-sm">
                  {player.name}
                </span>

                {entry.included && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const current = parseInt(entry.score || "0", 10);
                        setScore(
                          entry.player_id,
                          Math.max(0, current - 1).toString()
                        );
                      }}
                      className="w-8 h-8 rounded-medieval border-2 border-medieval-brown/30 flex items-center justify-center text-medieval-brown hover:bg-parchment-dark"
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={entry.score}
                      onChange={(e) => setScore(entry.player_id, e.target.value)}
                      placeholder="0"
                      className={cn(
                        "w-16 text-center rounded-medieval border-2 border-medieval-brown/30 bg-parchment-light",
                        "py-2 font-cinzel font-bold text-medieval-dark text-base",
                        "focus:outline-none focus:border-medieval-gold"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const current = parseInt(entry.score || "0", 10);
                        setScore(entry.player_id, (current + 1).toString());
                      }}
                      className="w-8 h-8 rounded-medieval border-2 border-medieval-brown/30 flex items-center justify-center text-medieval-brown hover:bg-parchment-dark"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Extensions */}
      <Card>
        <CardHeader>
          <CardTitle>Extensions Utilitzades</CardTitle>
        </CardHeader>
        <div className="flex flex-wrap gap-2 mb-4">
          {extensions.map((ext) => (
            <button
              key={ext.id}
              type="button"
              onClick={() => toggleExt(ext.id)}
              className={cn(
                "px-3 py-1.5 rounded-medieval border-2 text-sm font-garamond transition-all",
                selectedExtIds.has(ext.id)
                  ? "bg-medieval-gold/20 border-medieval-gold text-medieval-dark font-semibold"
                  : "bg-parchment-light border-medieval-brown/20 text-medieval-stone hover:border-medieval-brown/40"
              )}
            >
              {selectedExtIds.has(ext.id) && "✓ "}
              {ext.name}
              {!ext.is_official && (
                <span className="ml-1 text-xs opacity-60">(personalitzada)</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newExtName}
            onChange={(e) => setNewExtName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCustomExt()}
            placeholder="Afegeix extensió personalitzada..."
            className={cn(
              "flex-1 rounded-medieval border-2 border-medieval-brown/30 bg-parchment-light",
              "px-3 py-2 font-garamond text-sm text-medieval-dark placeholder:text-medieval-stone/60",
              "focus:outline-none focus:border-medieval-gold"
            )}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddCustomExt}
            disabled={!newExtName.trim() || addingExt}
            loading={addingExt}
          >
            <Plus size={14} />
            Afegeix
          </Button>
        </div>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes (opcional)</CardTitle>
        </CardHeader>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Algun moment memorable d'aquesta partida..."
          rows={3}
        />
      </Card>

      <Button
        onClick={handleSubmit}
        loading={isPending}
        size="lg"
        className="w-full"
      >
        {editingGame ? "⚔️ Desa els Canvis" : "🏰 Desa la Partida"}
      </Button>
    </div>
  );
}
