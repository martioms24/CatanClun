"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPlayerBalance } from "./gambling-actions";
import {
  REEL_STRIPS,
  PAYLINE_PATTERNS,
  PAYOUTS,
  BOOK_SYMBOL,
  BOOK_SCATTER_PAYOUTS,
  FREE_SPINS_COUNT,
  MAX_DAILY_SPINS,
  SYMBOLS,
} from "@/lib/slots-config";
import type { SlotSpinResult, SlotsSession } from "@/types";
import crypto from "crypto";

// ── Helpers ─────────────────────────────────────────────────

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

function generateReels(): number[][] {
  const reels: number[][] = [];
  for (let r = 0; r < 5; r++) {
    const strip = REEL_STRIPS[r];
    const stop = crypto.randomInt(strip.length);
    const col: number[] = [];
    for (let row = 0; row < 3; row++) {
      col.push(strip[(stop + row) % strip.length]);
    }
    reels.push(col);
  }
  return reels;
}

function applyExpandingSymbol(reels: number[][], expandingSymbol: number): number[][] {
  return reels.map((col) => {
    if (col.includes(expandingSymbol)) {
      return [expandingSymbol, expandingSymbol, expandingSymbol];
    }
    return col;
  });
}

function evaluatePaylines(
  reels: number[][],
  lineBet: number
): { winningLines: { line: number; symbols: number[]; payout: number }[]; totalPayout: number } {
  const winningLines: { line: number; symbols: number[]; payout: number }[] = [];
  let totalPayout = 0;

  for (let lineIdx = 0; lineIdx < PAYLINE_PATTERNS.length; lineIdx++) {
    const pattern = PAYLINE_PATTERNS[lineIdx];
    const lineSymbols = pattern.map((row, reel) => reels[reel][row]);

    // Get the first non-book symbol (or book if all books)
    let matchSymbol = lineSymbols[0];
    if (matchSymbol === BOOK_SYMBOL) {
      // Find first non-book or stay as book
      for (let i = 1; i < lineSymbols.length; i++) {
        if (lineSymbols[i] !== BOOK_SYMBOL) {
          matchSymbol = lineSymbols[i];
          break;
        }
      }
    }

    // Count consecutive matches from left (book = wild)
    let matchCount = 0;
    for (let i = 0; i < lineSymbols.length; i++) {
      if (lineSymbols[i] === matchSymbol || lineSymbols[i] === BOOK_SYMBOL) {
        matchCount++;
      } else {
        break;
      }
    }

    if (matchCount >= 3 && matchSymbol !== BOOK_SYMBOL) {
      const payoutTable = PAYOUTS[matchSymbol];
      const payout = (payoutTable[matchCount - 3] ?? payoutTable[2]) * lineBet;
      winningLines.push({ line: lineIdx, symbols: lineSymbols, payout });
      totalPayout += payout;
    }
  }

  return { winningLines, totalPayout };
}

function countScatters(reels: number[][]): number {
  let count = 0;
  for (const col of reels) {
    for (const sym of col) {
      if (sym === BOOK_SYMBOL) count++;
    }
  }
  return count;
}

function getScatterPayout(scatterCount: number, totalBet: number): number {
  return (BOOK_SCATTER_PAYOUTS[scatterCount] ?? 0) * totalBet;
}

// ── Public actions ──────────────────────────────────────────

export async function getSlotsDailyCount(playerId: string): Promise<number> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase
    .from("slots_games")
    .select("*", { count: "exact", head: true })
    .eq("player_id", playerId)
    .eq("is_free_spin", false)
    .gte("created_at", today + "T00:00:00Z")
    .lt("created_at", today + "T23:59:59.999Z");
  return count ?? 0;
}

export async function getActiveSession(playerId: string): Promise<SlotsSession | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("slots_sessions")
    .select("*")
    .eq("player_id", playerId)
    .gt("free_spins_remaining", 0)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as SlotsSession | null;
}

export async function spin(wager: number): Promise<{ error?: string; result?: SlotSpinResult }> {
  if (wager <= 0) return { error: "L'aposta ha de ser positiva." };

  const supabase = await createClient();
  const playerId = await getCurrentPlayerId(supabase);
  if (!playerId) return { error: "No s'ha pogut identificar l'usuari." };

  // Check for active free spin session first
  const session = await getActiveSession(playerId);

  if (!session) {
    // Normal spin — check daily limit and balance
    const dailyCount = await getSlotsDailyCount(playerId);
    if (dailyCount >= MAX_DAILY_SPINS) {
      return { error: `Has arribat al límit de ${MAX_DAILY_SPINS} tirades diàries.` };
    }

    const balance = await getPlayerBalance(playerId);
    if (wager > balance) {
      return { error: `No tens prou punts. Saldo: ${balance}` };
    }
  }

  const isFreeSpin = !!session;
  const effectiveWager = isFreeSpin ? session.base_wager : wager;

  // Generate reels
  let reels = generateReels();

  // Apply expanding symbol during free spins
  let expandingSymbol: number | null = null;
  if (isFreeSpin && session) {
    expandingSymbol = session.expanding_symbol;
    reels = applyExpandingSymbol(reels, expandingSymbol);
  }

  // Evaluate wins
  const lineBet = Math.max(1, Math.floor(effectiveWager / PAYLINE_PATTERNS.length));
  const { winningLines, totalPayout: linePayout } = evaluatePaylines(reels, lineBet);

  // Scatter evaluation
  const scatterCount = countScatters(reels);
  const scatterPayout = getScatterPayout(scatterCount, effectiveWager);
  const totalPayout = linePayout + scatterPayout;

  // Free spins trigger
  let freeSpinsAwarded = 0;
  let newExpandingSymbol: number | null = expandingSymbol;
  let freeSpinsRemaining = session?.free_spins_remaining ? session.free_spins_remaining - 1 : 0;

  if (scatterCount >= 3) {
    freeSpinsAwarded = FREE_SPINS_COUNT;
    // Pick random expanding symbol (not the book)
    const regularSymbols = SYMBOLS.filter((s) => s.id !== BOOK_SYMBOL);
    newExpandingSymbol = regularSymbols[crypto.randomInt(regularSymbols.length)].id;

    if (session) {
      // Retrigger: add spins to existing session
      freeSpinsRemaining += FREE_SPINS_COUNT;
      await supabase
        .from("slots_sessions")
        .update({
          free_spins_remaining: freeSpinsRemaining,
          expanding_symbol: newExpandingSymbol,
        })
        .eq("id", session.id);
    } else {
      // New session
      freeSpinsRemaining = FREE_SPINS_COUNT;
      const { data: newSession } = await supabase
        .from("slots_sessions")
        .insert({
          player_id: playerId,
          free_spins_remaining: freeSpinsRemaining,
          expanding_symbol: newExpandingSymbol,
          base_wager: effectiveWager,
        })
        .select("id")
        .single();

      // Update session reference for the game record
      if (newSession) {
        // Will be used below
      }
    }
  } else if (session) {
    // Decrement remaining spins
    if (freeSpinsRemaining <= 0) {
      await supabase.from("slots_sessions").delete().eq("id", session.id);
    } else {
      await supabase
        .from("slots_sessions")
        .update({ free_spins_remaining: freeSpinsRemaining })
        .eq("id", session.id);
    }
  }

  // Save game record
  const { data: game } = await supabase
    .from("slots_games")
    .insert({
      player_id: playerId,
      wager: isFreeSpin ? 0 : wager, // free spins don't cost
      payout: totalPayout,
      reels,
      winning_lines: winningLines.length > 0 ? winningLines : null,
      is_free_spin: isFreeSpin,
      session_id: session?.id ?? null,
    })
    .select("id")
    .single();

  revalidatePath("/gambling");

  return {
    result: {
      reels,
      winningLines,
      totalPayout,
      scatterCount,
      freeSpinsAwarded,
      expandingSymbol: newExpandingSymbol,
      freeSpinsRemaining,
      isFreeSpin,
      gameId: game?.id ?? "",
    },
  };
}
