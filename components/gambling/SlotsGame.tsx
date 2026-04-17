"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { spin, getSlotsDailyCount, getActiveSession } from "@/app/actions/slots-actions";
import { cn } from "@/lib/utils";
import {
  SYMBOLS,
  PAYLINE_PATTERNS,
  PAYOUTS,
  BOOK_SCATTER_PAYOUTS,
  BOOK_SYMBOL,
  TIER_COLORS,
  TIER_BG,
  MAX_DAILY_SPINS,
} from "@/lib/slots-config";
import type { SlotSpinResult } from "@/types";
import { Coins, Sparkles, BookOpen, RotateCcw, Zap } from "lucide-react";

export function SlotsGame({
  currentPlayerId,
  currentBalance,
}: {
  currentPlayerId: string | null;
  currentBalance: number;
}) {
  const [wager, setWager] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SlotSpinResult | null>(null);
  const [dailySpins, setDailySpins] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showPaytable, setShowPaytable] = useState(false);
  const [animatingReels, setAnimatingReels] = useState<boolean[]>([false, false, false, false, false]);
  const [displayReels, setDisplayReels] = useState<number[][] | null>(null);
  const animationRef = useRef<NodeJS.Timeout[]>([]);

  // Load daily count on mount
  useEffect(() => {
    if (currentPlayerId) {
      getSlotsDailyCount(currentPlayerId).then(setDailySpins);
      getActiveSession(currentPlayerId).then((session) => {
        if (session) {
          setResult((prev) =>
            prev
              ? prev
              : {
                  reels: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
                  winningLines: [],
                  totalPayout: 0,
                  scatterCount: 0,
                  freeSpinsAwarded: 0,
                  expandingSymbol: session.expanding_symbol,
                  freeSpinsRemaining: session.free_spins_remaining,
                  isFreeSpin: true,
                  gameId: "",
                }
          );
        }
      });
    }
  }, [currentPlayerId]);

  const isFreeSpin = result?.freeSpinsRemaining ? result.freeSpinsRemaining > 0 : false;

  // Animate reels spinning
  const animateSpinning = useCallback(() => {
    // Clear any existing animation
    animationRef.current.forEach(clearInterval);
    animationRef.current = [];

    setAnimatingReels([true, true, true, true, true]);

    // Create random display for each reel
    for (let reel = 0; reel < 5; reel++) {
      const interval = setInterval(() => {
        setDisplayReels((prev) => {
          const next = prev ? prev.map((r) => [...r]) : Array.from({ length: 5 }, () => [0, 0, 0]);
          next[reel] = [
            Math.floor(Math.random() * 8),
            Math.floor(Math.random() * 8),
            Math.floor(Math.random() * 8),
          ];
          return next;
        });
      }, 80);
      animationRef.current.push(interval);
    }
  }, []);

  const stopAnimation = useCallback(
    (finalReels: number[][]) => {
      // Stop reels sequentially
      for (let reel = 0; reel < 5; reel++) {
        setTimeout(() => {
          if (animationRef.current[reel]) {
            clearInterval(animationRef.current[reel]);
          }
          setDisplayReels((prev) => {
            const next = prev ? prev.map((r) => [...r]) : finalReels.map((r) => [...r]);
            next[reel] = finalReels[reel];
            return next;
          });
          setAnimatingReels((prev) => {
            const next = [...prev];
            next[reel] = false;
            return next;
          });
        }, 300 + reel * 250);
      }
    },
    []
  );

  async function handleSpin() {
    if (!currentPlayerId) return;
    setError(null);
    setSpinning(true);

    animateSpinning();

    const { error: err, result: res } = await spin(isFreeSpin ? 0 : wager);

    if (err) {
      setError(err);
      setSpinning(false);
      animationRef.current.forEach(clearInterval);
      setAnimatingReels([false, false, false, false, false]);
      return;
    }

    if (res) {
      stopAnimation(res.reels);
      // Wait for all reels to stop
      setTimeout(() => {
        setResult(res);
        setSpinning(false);
        if (!res.isFreeSpin) {
          setDailySpins((p) => p + 1);
        }
      }, 300 + 5 * 250 + 200);
    }
  }

  const reelsToShow = displayReels ?? result?.reels ?? null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-sm font-garamond text-medieval-stone">
          <RotateCcw size={14} />
          {dailySpins}/{MAX_DAILY_SPINS} tirades avui
        </div>
        {isFreeSpin && (
          <div className="flex items-center gap-2 px-3 py-1 bg-medieval-gold/20 border-2 border-medieval-gold rounded-medieval animate-pulse">
            <Sparkles size={14} className="text-medieval-gold" />
            <span className="font-cinzel text-medieval-gold text-sm font-bold">
              Free Spins: {result?.freeSpinsRemaining}
            </span>
            {result?.expandingSymbol != null && (
              <Image
                src={SYMBOLS[result.expandingSymbol].image}
                alt="expanding"
                width={20}
                height={20}
                className="rounded-sm"
              />
            )}
          </div>
        )}
      </div>

      {/* Slot machine */}
      <Card variant="stone" className="p-2 sm:p-4">
        <div className="bg-medieval-dark/90 rounded-medieval p-3 sm:p-4 border-2 border-medieval-gold/50">
          {/* Reels grid */}
          <div className="grid grid-cols-5 gap-1 sm:gap-2 mb-3">
            {[0, 1, 2, 3, 4].map((reelIdx) => (
              <div key={reelIdx} className="flex flex-col gap-1">
                {[0, 1, 2].map((rowIdx) => {
                  const symbolId = reelsToShow?.[reelIdx]?.[rowIdx] ?? 0;
                  const symbol = SYMBOLS[symbolId];
                  const isWinning =
                    result?.winningLines?.some(
                      (wl) => PAYLINE_PATTERNS[wl.line]?.[reelIdx] === rowIdx
                    ) && !spinning;
                  const isExpanding =
                    isFreeSpin &&
                    result?.expandingSymbol != null &&
                    symbolId === result.expandingSymbol &&
                    !spinning;

                  return (
                    <div
                      key={`${reelIdx}-${rowIdx}`}
                      className={cn(
                        "relative aspect-square rounded-sm border-2 overflow-hidden transition-all duration-300",
                        animatingReels[reelIdx] && "animate-pulse",
                        isWinning
                          ? "border-medieval-gold bg-medieval-gold/30 shadow-[0_0_12px_rgba(212,175,55,0.5)] scale-105"
                          : isExpanding
                          ? "border-medieval-gold/70 bg-medieval-gold/20"
                          : `${TIER_COLORS[symbol.tier]} ${TIER_BG[symbol.tier]}`
                      )}
                    >
                      <Image
                        src={symbol.image}
                        alt={symbol.name}
                        fill
                        className="object-contain p-0.5"
                        sizes="80px"
                      />
                      {symbolId === BOOK_SYMBOL && (
                        <div className="absolute inset-0 bg-medieval-gold/10 animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Win display */}
          {result && !spinning && result.totalPayout > 0 && (
            <div className="text-center py-2 bg-medieval-gold/20 rounded-medieval border border-medieval-gold/40 mb-3 animate-pulse">
              <span className="font-cinzel text-medieval-gold text-lg font-bold">
                +{result.totalPayout} pts!
              </span>
              {result.freeSpinsAwarded > 0 && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Sparkles size={14} className="text-medieval-gold" />
                  <span className="font-garamond text-medieval-gold text-sm">
                    {result.freeSpinsAwarded} Free Spins! Símbol expansiu: {SYMBOLS[result.expandingSymbol!]?.name}
                  </span>
                </div>
              )}
            </div>
          )}

          {result && !spinning && result.totalPayout === 0 && result.freeSpinsAwarded > 0 && (
            <div className="text-center py-2 bg-medieval-gold/20 rounded-medieval border border-medieval-gold/40 mb-3 animate-pulse">
              <div className="flex items-center justify-center gap-1">
                <Sparkles size={14} className="text-medieval-gold" />
                <span className="font-cinzel text-medieval-gold text-sm font-bold">
                  {result.freeSpinsAwarded} Free Spins! Símbol expansiu: {SYMBOLS[result.expandingSymbol!]?.name}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {!isFreeSpin && (
          <div className="flex items-center gap-2">
            <label className="font-cinzel text-medieval-dark text-sm">Aposta:</label>
            <input
              type="number"
              min={1}
              max={currentBalance}
              value={wager}
              onChange={(e) => setWager(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 px-2 py-1.5 rounded-medieval border border-medieval-brown/30 bg-parchment-light font-garamond text-medieval-dark text-sm focus:outline-none focus:border-medieval-gold"
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
        )}

        <Button
          onClick={handleSpin}
          disabled={spinning || (!isFreeSpin && dailySpins >= MAX_DAILY_SPINS)}
          loading={spinning}
          variant="primary"
          className="min-w-[140px]"
        >
          {isFreeSpin ? (
            <>
              <Sparkles size={16} />
              Free Spin!
            </>
          ) : (
            <>
              <Zap size={16} />
              Tirar ({wager} pts)
            </>
          )}
        </Button>
      </div>

      {error && <p className="font-garamond text-red-700 text-sm">{error}</p>}

      {/* Paytable toggle */}
      <button
        onClick={() => setShowPaytable(!showPaytable)}
        className="flex items-center gap-1 text-medieval-stone hover:text-medieval-gold font-garamond text-sm transition-colors"
      >
        <BookOpen size={14} />
        {showPaytable ? "Amagar taula" : "Taula de pagaments"}
      </button>

      {showPaytable && (
        <Card className="text-sm">
          <h4 className="font-cinzel text-medieval-dark font-bold mb-3">Taula de pagaments</h4>

          <div className="space-y-2">
            {SYMBOLS.filter((s) => s.id !== BOOK_SYMBOL).map((symbol) => (
              <div key={symbol.id} className="flex items-center gap-2">
                <Image src={symbol.image} alt={symbol.name} width={28} height={28} className="rounded-sm" />
                <span className="font-garamond text-medieval-dark w-20">{symbol.name}</span>
                <div className="flex gap-3 text-xs font-garamond text-medieval-stone">
                  <span>×3: <b className="text-medieval-dark">{PAYOUTS[symbol.id][0]}</b></span>
                  <span>×4: <b className="text-medieval-dark">{PAYOUTS[symbol.id][1]}</b></span>
                  <span>×5: <b className="text-medieval-dark">{PAYOUTS[symbol.id][2]}</b></span>
                </div>
              </div>
            ))}

            <div className="pt-2 border-t border-medieval-brown/20">
              <div className="flex items-center gap-2 mb-1">
                <Image src={SYMBOLS[BOOK_SYMBOL].image} alt="Book" width={28} height={28} className="rounded-sm" />
                <span className="font-garamond text-medieval-gold font-bold">El Llibre (Wild + Scatter)</span>
              </div>
              <p className="font-garamond text-medieval-stone text-xs ml-9">
                Substitueix qualsevol símbol. 3+ Llibres → {BOOK_SCATTER_PAYOUTS[3]}× aposta + 10 Free Spins amb símbol expansiu.
              </p>
              <div className="flex gap-3 ml-9 mt-1 text-xs font-garamond text-medieval-stone">
                {Object.entries(BOOK_SCATTER_PAYOUTS).map(([count, payout]) => (
                  <span key={count}>×{count}: <b className="text-medieval-gold">{payout}×</b></span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-medieval-brown/20">
            <p className="font-garamond text-medieval-stone text-xs">
              9 línies de pagament · Pagaments = multiplicador × aposta per línia · Free Spins: el símbol expansiu omple el carret sencer
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
