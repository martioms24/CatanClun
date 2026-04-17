"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  startMinesGame,
  revealTile,
  cashOut,
  getActiveMinesGame,
  getMinesDailyCount,
} from "@/app/actions/mines-actions";
import { cn } from "@/lib/utils";
import type { MinesGameState } from "@/types";
import { Bomb, Gem, Coins, HandCoins, RotateCcw } from "lucide-react";

const GRID_SIZE = 5;
const MAX_DAILY = 3;

export function MinesGame({
  currentPlayerId,
  currentBalance,
}: {
  currentPlayerId: string | null;
  currentBalance: number;
}) {
  const [game, setGame] = useState<MinesGameState | null>(null);
  const [wager, setWager] = useState(10);
  const [numMines, setNumMines] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyGames, setDailyGames] = useState(0);
  const [explodedTile, setExplodedTile] = useState<number | null>(null);

  // Load active game and daily count
  useEffect(() => {
    if (currentPlayerId) {
      getActiveMinesGame(currentPlayerId).then(setGame);
      getMinesDailyCount(currentPlayerId).then(setDailyGames);
    }
  }, [currentPlayerId]);

  async function handleStart() {
    setError(null);
    setLoading(true);
    setExplodedTile(null);
    const { error: err, game: newGame } = await startMinesGame(wager, numMines);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    if (newGame) {
      setGame(newGame);
      setDailyGames((p) => p + 1);
    }
  }

  async function handleReveal(tileIndex: number) {
    if (!game || game.status !== "active") return;
    if (game.revealed.includes(tileIndex)) return;

    setError(null);
    setLoading(true);
    const { error: err, game: updated } = await revealTile(game.id, tileIndex);
    setLoading(false);

    if (err) {
      setError(err);
      return;
    }
    if (updated) {
      if (updated.status === "exploded") {
        setExplodedTile(tileIndex);
      }
      setGame(updated);
    }
  }

  async function handleCashOut() {
    if (!game) return;
    setError(null);
    setLoading(true);
    const { error: err, game: updated } = await cashOut(game.id);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    if (updated) setGame(updated);
  }

  function handleNewGame() {
    setGame(null);
    setExplodedTile(null);
    setError(null);
  }

  const isGameOver = game?.status === "cashed_out" || game?.status === "exploded";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-garamond text-medieval-stone">
        <RotateCcw size={14} />
        {dailyGames}/{MAX_DAILY} partides avui
      </div>

      {!game ? (
        /* ── Setup screen ─────────────────────────── */
        <Card>
          <h4 className="font-cinzel text-medieval-dark font-bold mb-3">Nova partida de Mines</h4>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="font-cinzel text-medieval-dark text-sm w-20">Aposta:</label>
              <input
                type="number"
                min={1}
                max={currentBalance}
                value={wager}
                onChange={(e) => setWager(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 px-2 py-1.5 rounded-medieval border border-medieval-brown/30 bg-parchment-light font-garamond text-medieval-dark text-sm focus:outline-none focus:border-medieval-gold"
              />
              <div className="flex gap-1">
                {[5, 10, 25, 50].map((v) => (
                  <button
                    key={v}
                    onClick={() => setWager(v)}
                    className={cn(
                      "px-2 py-1 rounded-medieval text-xs font-cinzel border transition-colors",
                      wager === v
                        ? "bg-medieval-gold/20 border-medieval-gold text-medieval-gold"
                        : "border-medieval-brown/20 text-medieval-stone hover:border-medieval-gold/50"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="font-cinzel text-medieval-dark text-sm w-20">Mines:</label>
              <input
                type="range"
                min={1}
                max={24}
                value={numMines}
                onChange={(e) => setNumMines(parseInt(e.target.value))}
                className="flex-1 accent-medieval-burgundy"
              />
              <span className="font-cinzel text-medieval-dark font-bold w-8 text-center">
                {numMines}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-garamond text-medieval-stone">
              <span>Risc: {numMines <= 3 ? "Baix" : numMines <= 8 ? "Mig" : numMines <= 16 ? "Alt" : "Extrem"}</span>
              <span>Caselles segures: {25 - numMines}</span>
            </div>

            <Button
              onClick={handleStart}
              disabled={loading || dailyGames >= MAX_DAILY}
              loading={loading}
              variant="primary"
              className="w-full"
            >
              <Bomb size={16} />
              Començar ({wager} pts)
            </Button>
          </div>
        </Card>
      ) : (
        /* ── Active game / Results ────────────────── */
        <>
          {/* Game info bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="font-garamond text-medieval-stone text-sm">
                <Bomb size={12} className="inline" /> {game.num_mines} mines
              </span>
              <span className="font-garamond text-medieval-stone text-sm">
                <Coins size={12} className="inline" /> Aposta: {game.wager}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={cn(
                "font-cinzel font-bold text-lg",
                game.multiplier > 1 ? "text-medieval-green" : "text-medieval-dark"
              )}>
                ×{game.multiplier.toFixed(2)}
              </span>
              {game.status === "active" && game.revealed.length > 0 && (
                <span className="font-garamond text-medieval-stone text-xs">
                  → ×{game.nextMultiplier.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Grid */}
          <Card variant="stone" className="p-2 sm:p-4">
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2 max-w-[320px] mx-auto">
              {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
                const isRevealed = game.revealed.includes(i);
                const isMine =
                  isGameOver && game.minePositions?.includes(i);
                const isExploded = explodedTile === i;

                return (
                  <button
                    key={i}
                    onClick={() => handleReveal(i)}
                    disabled={
                      loading ||
                      isRevealed ||
                      isGameOver ||
                      game.status !== "active"
                    }
                    className={cn(
                      "aspect-square rounded-medieval border-2 flex items-center justify-center transition-all duration-200",
                      isExploded
                        ? "bg-red-600 border-red-800 scale-110 animate-pulse"
                        : isMine
                        ? "bg-medieval-burgundy/30 border-medieval-burgundy/50"
                        : isRevealed
                        ? "bg-medieval-green/20 border-medieval-green/40 scale-95"
                        : game.status === "active"
                        ? "bg-parchment border-medieval-brown/30 hover:border-medieval-gold hover:bg-medieval-gold/10 hover:scale-105 cursor-pointer active:scale-95"
                        : "bg-parchment-dark border-medieval-brown/20 opacity-60"
                    )}
                  >
                    {isExploded ? (
                      <Bomb size={20} className="text-white" />
                    ) : isMine ? (
                      <Bomb size={16} className="text-medieval-burgundy" />
                    ) : isRevealed ? (
                      <Gem size={16} className="text-medieval-green" />
                    ) : (
                      <span className="text-medieval-stone/30 text-xs">?</span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Action buttons */}
          {game.status === "active" && (
            <div className="flex gap-3">
              <Button
                onClick={handleCashOut}
                disabled={loading || game.revealed.length === 0}
                loading={loading}
                variant="primary"
                className="flex-1"
              >
                <HandCoins size={16} />
                Cobrar {game.revealed.length > 0
                  ? `${Math.floor(game.wager * game.multiplier)} pts (×${game.multiplier.toFixed(2)})`
                  : ""}
              </Button>
            </div>
          )}

          {/* Result */}
          {isGameOver && (
            <Card variant={game.status === "cashed_out" ? "gold" : "parchment"}>
              <div className="text-center py-2">
                {game.status === "cashed_out" ? (
                  <>
                    <p className="font-cinzel text-medieval-green text-lg font-bold">
                      Has cobrat {game.payout} pts!
                    </p>
                    <p className="font-garamond text-medieval-stone text-sm">
                      Multiplicador: ×{game.multiplier.toFixed(2)} · Benefici net: {game.payout - game.wager > 0 ? "+" : ""}{game.payout - game.wager}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-cinzel text-medieval-burgundy text-lg font-bold">
                      BOOM! Has perdut {game.wager} pts
                    </p>
                    <p className="font-garamond text-medieval-stone text-sm">
                      Has revelat {game.revealed.length - 1} caselles abans de la mina
                    </p>
                  </>
                )}
                <Button
                  onClick={handleNewGame}
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  disabled={dailyGames >= MAX_DAILY}
                >
                  <RotateCcw size={14} />
                  {dailyGames >= MAX_DAILY ? "Límit diari assolit" : "Nova partida"}
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      {error && <p className="font-garamond text-red-700 text-sm">{error}</p>}
    </div>
  );
}
