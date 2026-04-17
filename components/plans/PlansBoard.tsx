"use client";

import { useState, useTransition } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MeepleIcon } from "@/components/ui/MeepleIcon";
import { cn } from "@/lib/utils";
import {
  addPlan,
  completePlan,
  updatePlanStatus,
  updatePlanPoints,
  deletePlan,
} from "@/app/actions/plan-actions";
import type { Plan, PlanStatus, Player } from "@/types";
import {
  Scroll,
  PlusCircle,
  Check,
  X,
  RotateCcw,
  Trash2,
  Sparkles,
  Ban,
  ListTodo,
  Pencil,
  Coins,
} from "lucide-react";

type Tab = PlanStatus;

const TABS: { key: Tab; label: string; icon: typeof ListTodo }[] = [
  { key: "pending", label: "Pendents", icon: ListTodo },
  { key: "done", label: "Fets", icon: Sparkles },
  { key: "discarded", label: "Descartats", icon: Ban },
];

export function PlansBoard({
  initialPlans,
  players,
}: {
  initialPlans: Plan[];
  players: Player[];
}) {
  const [tab, setTab] = useState<Tab>("pending");
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const counts: Record<Tab, number> = {
    pending: initialPlans.filter((p) => p.status === "pending").length,
    done: initialPlans.filter((p) => p.status === "done").length,
    discarded: initialPlans.filter((p) => p.status === "discarded").length,
  };

  const visible = initialPlans.filter((p) => p.status === tab);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addPlan(title);
      if (result.error) {
        setError(result.error);
        return;
      }
      setTitle("");
      setAdding(false);
    });
  }

  function handleStatus(id: string, status: PlanStatus) {
    setPendingId(id);
    startTransition(async () => {
      await updatePlanStatus(id, status);
      setPendingId(null);
    });
  }

  function handleDelete(id: string) {
    setPendingId(id);
    startTransition(async () => {
      await deletePlan(id);
      setPendingId(null);
    });
  }

  function handleComplete(id: string, playerIds: string[]) {
    setPendingId(id);
    startTransition(async () => {
      await completePlan(id, playerIds);
      setPendingId(null);
    });
  }

  function handleUpdatePoints(id: string, points: number) {
    setPendingId(id);
    startTransition(async () => {
      await updatePlanPoints(id, points);
      setPendingId(null);
    });
  }

  return (
    <div>
      {/* Add plan */}
      <div className="mb-5">
        {!adding ? (
          <Button
            variant="primary"
            onClick={() => setAdding(true)}
            className="w-full sm:w-auto"
          >
            <PlusCircle size={16} />
            Afegir un pla nou
          </Button>
        ) : (
          <Card>
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <label className="font-cinzel text-medieval-dark text-sm">
                Nou pla
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Què voleu fer?"
                autoFocus
                maxLength={200}
                className="w-full px-3 py-2 rounded-medieval border-2 border-medieval-brown/30 bg-parchment-light font-garamond text-medieval-dark focus:outline-none focus:border-medieval-gold transition-colors"
              />
              {error && (
                <p className="font-garamond text-red-700 text-sm">{error}</p>
              )}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isPending}
                  disabled={!title.trim()}
                >
                  <Check size={14} />
                  Afegir
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAdding(false);
                    setTitle("");
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

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b-2 border-medieval-brown/20 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 font-cinzel text-sm transition-colors whitespace-nowrap -mb-0.5 border-b-2",
              tab === key
                ? "text-medieval-gold border-medieval-gold font-semibold"
                : "text-medieval-stone border-transparent hover:text-medieval-brown"
            )}
          >
            <Icon size={14} />
            {label}
            <span
              className={cn(
                "ml-1 rounded-full px-1.5 text-xs",
                tab === key
                  ? "bg-medieval-gold/20 text-medieval-dark"
                  : "bg-medieval-brown/10 text-medieval-stone"
              )}
            >
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Plans list */}
      {visible.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-medieval-stone font-garamond">
            <Scroll size={32} className="mx-auto mb-2 opacity-30" />
            {tab === "pending" && <p>Cap pla pendent. Afegiu-ne un!</p>}
            {tab === "done" && <p>Encara no heu complert cap pla.</p>}
            {tab === "discarded" && <p>Cap pla descartat.</p>}
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((plan) => (
            <PlanRow
              key={plan.id}
              plan={plan}
              players={players}
              busy={pendingId === plan.id && isPending}
              onStatus={handleStatus}
              onDelete={handleDelete}
              onComplete={handleComplete}
              onUpdatePoints={handleUpdatePoints}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PlanRow({
  plan,
  players,
  busy,
  onStatus,
  onDelete,
  onComplete,
  onUpdatePoints,
}: {
  plan: Plan;
  players: Player[];
  busy: boolean;
  onStatus: (id: string, status: PlanStatus) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string, playerIds: string[]) => void;
  onUpdatePoints: (id: string, points: number) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [editingPoints, setEditingPoints] = useState(false);
  const [editPoints, setEditPoints] = useState(plan.points ?? 10);

  const titleClass = cn(
    "font-garamond text-medieval-dark text-base flex-1 break-words",
    plan.status === "done" && "line-through text-medieval-stone",
    plan.status === "discarded" && "line-through text-medieval-stone italic"
  );

  function handleDeleteClick() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    setConfirmDelete(false);
    onDelete(plan.id);
  }

  function togglePlayer(id: string) {
    setSelectedPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleConfirmComplete() {
    if (selectedPlayers.size === 0) return;
    onComplete(plan.id, Array.from(selectedPlayers));
    setCompleting(false);
    setSelectedPlayers(new Set());
  }

  function handleSavePoints() {
    onUpdatePoints(plan.id, editPoints);
    setEditingPoints(false);
  }

  return (
    <Card
      className={cn("py-3 px-3 transition-opacity", busy && "opacity-50")}
      variant={
        plan.status === "done"
          ? "gold"
          : plan.status === "discarded"
          ? "stone"
          : "parchment"
      }
    >
      <div className="flex items-center gap-3">
        {plan.status === "done" && (
          <span className="text-xl shrink-0">✓</span>
        )}
        {plan.status === "discarded" && (
          <span className="text-xl shrink-0 text-medieval-stone">✕</span>
        )}
        <div className="flex-1 min-w-0">
          <p className={titleClass}>{plan.title}</p>

          {/* Show who completed it */}
          {plan.status === "done" && plan.completions && plan.completions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {plan.completions.map((c) => (
                <span
                  key={c.id}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-medieval-green/10 text-xs font-garamond text-medieval-dark"
                >
                  <MeepleIcon color={c.player?.color ?? "#8B4513"} size={12} name={c.player?.name} />
                  {c.player?.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Points badge */}
        <div className="flex items-center gap-1 shrink-0">
          {editingPoints ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={editPoints}
                onChange={(e) => setEditPoints(Math.max(0, Number(e.target.value)))}
                min={0}
                max={100}
                className="w-14 px-1 py-0.5 rounded border border-medieval-brown/30 bg-parchment-light font-garamond text-medieval-dark text-xs text-center focus:outline-none focus:border-medieval-gold"
              />
              <button
                onClick={handleSavePoints}
                disabled={busy}
                className="p-1 rounded text-medieval-green hover:bg-medieval-green/10"
              >
                <Check size={12} />
              </button>
              <button
                onClick={() => { setEditingPoints(false); setEditPoints(plan.points ?? 10); }}
                className="p-1 rounded text-medieval-stone hover:bg-medieval-stone/10"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setEditPoints(plan.points ?? 10); setEditingPoints(true); }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-medieval-gold/15 text-medieval-gold font-cinzel text-xs font-semibold hover:bg-medieval-gold/25 transition-colors"
              title="Editar punts"
            >
              <Coins size={10} />
              {plan.points ?? 10}pts
              <Pencil size={8} className="opacity-50" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {plan.status === "pending" && (
            <>
              <button
                onClick={() => setCompleting(!completing)}
                disabled={busy}
                aria-label="Marcar com a fet"
                className="p-1.5 rounded-medieval border border-medieval-green/40 bg-medieval-green/10 text-medieval-green hover:bg-medieval-green/20 transition-colors disabled:opacity-50"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => onStatus(plan.id, "discarded")}
                disabled={busy}
                aria-label="Descartar"
                className="p-1.5 rounded-medieval border border-medieval-stone/40 bg-medieval-stone/10 text-medieval-stone hover:bg-medieval-stone/20 transition-colors disabled:opacity-50"
              >
                <Ban size={14} />
              </button>
            </>
          )}
          {plan.status !== "pending" && (
            <button
              onClick={() => onStatus(plan.id, "pending")}
              disabled={busy}
              aria-label="Tornar a pendent"
              className="p-1.5 rounded-medieval border border-medieval-brown/30 bg-parchment-light text-medieval-brown hover:bg-parchment transition-colors disabled:opacity-50"
            >
              <RotateCcw size={14} />
            </button>
          )}
          {confirmDelete ? (
            <button
              onClick={handleDeleteClick}
              disabled={busy}
              className="flex items-center gap-1 px-2 py-1 rounded-medieval border-2 border-red-900 bg-medieval-burgundy text-parchment font-cinzel text-xs font-semibold transition-colors disabled:opacity-50 animate-pulse"
            >
              <Trash2 size={12} />
              Segur?
            </button>
          ) : (
            <button
              onClick={handleDeleteClick}
              disabled={busy}
              aria-label="Eliminar"
              className="p-1.5 rounded-medieval border border-medieval-burgundy/40 bg-medieval-burgundy/10 text-medieval-burgundy hover:bg-medieval-burgundy/20 transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Player selection for completing */}
      {completing && (
        <div className="mt-3 pt-3 border-t border-medieval-brown/20">
          <p className="font-garamond text-medieval-stone text-sm mb-2">
            Qui ho ha fet?
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {players.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePlayer(p.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-medieval border-2 text-sm font-garamond transition-all",
                  selectedPlayers.has(p.id)
                    ? "bg-medieval-gold/20 border-medieval-gold text-medieval-dark font-semibold"
                    : "bg-parchment-light border-medieval-brown/20 text-medieval-stone hover:border-medieval-brown/40"
                )}
              >
                <MeepleIcon color={p.color} size={16} name={p.name} />
                {p.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              disabled={selectedPlayers.size === 0 || busy}
              onClick={handleConfirmComplete}
            >
              <Check size={14} />
              Completar ({plan.points ?? 10} pts)
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setCompleting(false); setSelectedPlayers(new Set()); }}
            >
              Cancel·lar
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
