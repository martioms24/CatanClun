"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPlayerBalance } from "./gambling-actions";
import type { SportsMatch, SportsBet } from "@/types";

const ODDS_API_KEY = process.env.ODDS_API_KEY ?? "";
const ODDS_API_BASE = "https://api.the-odds-api.com/v4";

// Teams we track (partial match on team name)
const TRACKED_TEAMS = ["Barcelona", "Real Madrid", "Atletico"];

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

function isTrackedTeam(team: string): boolean {
  return TRACKED_TEAMS.some((t) => team.toLowerCase().includes(t.toLowerCase()));
}

// Common correct score outcomes
const CORRECT_SCORES = [
  "0-0", "1-0", "0-1", "2-0", "0-2", "1-1",
  "2-1", "1-2", "3-0", "0-3", "3-1", "1-3",
  "2-2", "3-2", "2-3", "4-0", "0-4", "4-1", "1-4",
];

// Generate synthetic correct score odds from h2h probabilities
function generateCorrectScoreOdds(
  homeOdds: number,
  drawOdds: number,
  awayOdds: number
): { label: string; odds: number }[] {
  const homeProb = 1 / homeOdds;
  const drawProb = 1 / drawOdds;
  const awayProb = 1 / awayOdds;

  // Estimate expected goals from probabilities
  const homeStrength = homeProb / (homeProb + awayProb);
  const totalGoals = 2.5; // average total goals
  const homeExpGoals = totalGoals * homeStrength;
  const awayExpGoals = totalGoals * (1 - homeStrength);

  function poisson(lambda: number, k: number): number {
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
  }

  function factorial(n: number): number {
    if (n <= 1) return 1;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }

  const results: { label: string; odds: number }[] = [];

  for (const score of CORRECT_SCORES) {
    const [h, a] = score.split("-").map(Number);
    let prob = poisson(homeExpGoals, h) * poisson(awayExpGoals, a);

    // Adjust draw probabilities slightly
    if (h === a) prob *= 1 + drawProb * 0.3;

    // Minimum probability and convert to odds with margin
    prob = Math.max(prob, 0.002);
    const odds = Math.round((1 / prob) * 1.08 * 100) / 100; // 8% margin
    results.push({ label: score, odds: Math.min(odds, 250) });
  }

  // Add "Altre" (other result)
  const sumProb = results.reduce((s, r) => s + 1 / r.odds, 0);
  const otherOdds = Math.round((1 / Math.max(1 - sumProb, 0.05)) * 1.08 * 100) / 100;
  results.push({ label: "Altre", odds: Math.min(otherOdds, 50) });

  return results;
}

// ── Fetch from The Odds API ─────────────────────────────────

type OddsApiEvent = {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  sport_title: string;
  bookmakers?: {
    key: string;
    markets: {
      key: string;
      outcomes: { name: string; price: number }[];
    }[];
  }[];
};

async function fetchOddsApiEvents(sportKey: string): Promise<OddsApiEvent[]> {
  if (!ODDS_API_KEY) return [];
  try {
    const url = `${ODDS_API_BASE}/sports/${sportKey}/odds/?apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal`;
    const res = await fetch(url, { next: { revalidate: 3600 } }); // cache 1hr
    if (!res.ok) return [];
    return (await res.json()) as OddsApiEvent[];
  } catch {
    return [];
  }
}

async function fetchScores(sportKey: string): Promise<{ id: string; completed: boolean; scores: { name: string; score: string }[] }[]> {
  if (!ODDS_API_KEY) return [];
  try {
    const url = `${ODDS_API_BASE}/sports/${sportKey}/scores/?apiKey=${ODDS_API_KEY}&daysFrom=3`;
    const res = await fetch(url, { next: { revalidate: 600 } }); // cache 10min
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// ── Sync matches + odds to Supabase ─────────────────────────

export async function syncSportsData(): Promise<{ error?: string; synced: number }> {
  const supabase = await createClient();

  if (!ODDS_API_KEY) {
    return { error: "ODDS_API_KEY no configurada.", synced: 0 };
  }

  const sportKeys = ["soccer_spain_la_liga", "soccer_uefa_champs_league", "soccer_spain_copa_del_rey"];
  let synced = 0;

  for (const sportKey of sportKeys) {
    const events = await fetchOddsApiEvents(sportKey);

    for (const event of events) {
      if (!isTrackedTeam(event.home_team) && !isTrackedTeam(event.away_team)) continue;

      // Upsert match
      const { data: match } = await supabase
        .from("sports_matches")
        .upsert(
          {
            api_match_id: event.id,
            home_team: event.home_team,
            away_team: event.away_team,
            competition: event.sport_title ?? sportKey,
            kickoff_at: event.commence_time,
            status: "upcoming",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "api_match_id" }
        )
        .select("id")
        .single();

      if (!match) continue;

      // Get best h2h odds from first bookmaker
      const bookmaker = event.bookmakers?.[0];
      const h2hMarket = bookmaker?.markets.find((m) => m.key === "h2h");

      if (h2hMarket) {
        let homeOdds = 2.0, drawOdds = 3.5, awayOdds = 3.0;

        for (const outcome of h2hMarket.outcomes) {
          const label =
            outcome.name === event.home_team ? "1" :
            outcome.name === "Draw" ? "X" : "2";

          if (label === "1") homeOdds = outcome.price;
          if (label === "X") drawOdds = outcome.price;
          if (label === "2") awayOdds = outcome.price;

          await supabase
            .from("sports_odds")
            .upsert(
              {
                match_id: match.id,
                market: "h2h",
                outcome_label: label,
                odds_decimal: outcome.price,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "match_id,market,outcome_label" }
            );
        }

        // Generate + upsert correct score odds
        const csOdds = generateCorrectScoreOdds(homeOdds, drawOdds, awayOdds);
        for (const cs of csOdds) {
          await supabase
            .from("sports_odds")
            .upsert(
              {
                match_id: match.id,
                market: "correct_score",
                outcome_label: cs.label,
                odds_decimal: cs.odds,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "match_id,market,outcome_label" }
            );
        }
      }

      synced++;
    }

    // Also check scores for finished matches
    const scores = await fetchScores(sportKey);
    for (const score of scores) {
      if (!score.completed) continue;
      const homeScore = score.scores?.find((s) =>
        events.find((e) => e.id === score.id && e.home_team === s.name)
      );
      const awayScore = score.scores?.find((s) =>
        events.find((e) => e.id === score.id && e.away_team === s.name)
      );

      if (homeScore && awayScore) {
        await supabase
          .from("sports_matches")
          .update({
            status: "finished",
            home_score: parseInt(homeScore.score),
            away_score: parseInt(awayScore.score),
            updated_at: new Date().toISOString(),
          })
          .eq("api_match_id", score.id);
      }
    }
  }

  // Auto-resolve finished matches
  await resolveFinishedMatches();

  revalidatePath("/gambling");
  return { synced };
}

// ── Auto-resolve bets on finished matches ───────────────────

async function resolveFinishedMatches() {
  const supabase = await createClient();

  const { data: finishedMatches } = await supabase
    .from("sports_matches")
    .select("*")
    .eq("status", "finished")
    .not("home_score", "is", null);

  if (!finishedMatches) return;

  for (const match of finishedMatches) {
    const { data: pendingBets } = await supabase
      .from("sports_bets")
      .select("*")
      .eq("match_id", match.id)
      .eq("status", "pending");

    if (!pendingBets || pendingBets.length === 0) continue;

    const homeScore = match.home_score as number;
    const awayScore = match.away_score as number;
    const h2hResult = homeScore > awayScore ? "1" : homeScore < awayScore ? "2" : "X";
    const exactScore = `${homeScore}-${awayScore}`;

    for (const bet of pendingBets) {
      let won = false;
      if (bet.market === "h2h") {
        won = bet.outcome_label === h2hResult;
      } else if (bet.market === "correct_score") {
        won = bet.outcome_label === exactScore;
      }

      const payout = won ? Math.floor(bet.amount * bet.odds_at_bet) : 0;

      await supabase
        .from("sports_bets")
        .update({ status: won ? "won" : "lost", payout })
        .eq("id", bet.id);
    }
  }
}

// ── Public queries ──────────────────────────────────────────

export async function getUpcomingMatches(): Promise<SportsMatch[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sports_matches")
    .select("*, odds:sports_odds(*), bets:sports_bets(*, player:players(*))")
    .in("status", ["upcoming", "live"])
    .gte("kickoff_at", new Date(Date.now() - 3 * 3600 * 1000).toISOString()) // include recent
    .order("kickoff_at", { ascending: true });

  return (data as SportsMatch[]) ?? [];
}

export async function getRecentResults(): Promise<SportsMatch[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sports_matches")
    .select("*, odds:sports_odds(*), bets:sports_bets(*, player:players(*))")
    .eq("status", "finished")
    .order("kickoff_at", { ascending: false })
    .limit(10);

  return (data as SportsMatch[]) ?? [];
}

export async function placeSportsBet(
  matchId: string,
  market: "h2h" | "correct_score",
  outcomeLabel: string,
  amount: number
): Promise<{ error?: string }> {
  if (amount <= 0) return { error: "L'aposta ha de ser positiva." };

  const supabase = await createClient();
  const playerId = await getCurrentPlayerId(supabase);
  if (!playerId) return { error: "No s'ha pogut identificar l'usuari." };

  // Check balance
  const balance = await getPlayerBalance(playerId);
  if (amount > balance) return { error: `No tens prou punts. Saldo: ${balance}` };

  // Check match is upcoming
  const { data: match } = await supabase
    .from("sports_matches")
    .select("status")
    .eq("id", matchId)
    .single();

  if (!match || match.status !== "upcoming") {
    return { error: "Aquest partit ja no accepta apostes." };
  }

  // Get odds
  const { data: odds } = await supabase
    .from("sports_odds")
    .select("odds_decimal")
    .eq("match_id", matchId)
    .eq("market", market)
    .eq("outcome_label", outcomeLabel)
    .single();

  if (!odds) return { error: "Quota no trobada." };

  // Check duplicate
  const { data: existing } = await supabase
    .from("sports_bets")
    .select("id")
    .eq("match_id", matchId)
    .eq("player_id", playerId)
    .eq("market", market)
    .eq("outcome_label", outcomeLabel)
    .maybeSingle();

  if (existing) return { error: "Ja has apostat a aquest resultat." };

  const { error } = await supabase.from("sports_bets").insert({
    match_id: matchId,
    player_id: playerId,
    market,
    outcome_label: outcomeLabel,
    amount,
    odds_at_bet: odds.odds_decimal,
  });

  if (error) return { error: error.message };

  revalidatePath("/gambling");
  return {};
}
