"use client";

import { useState, useTransition } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MeepleIcon } from "@/components/ui/MeepleIcon";
import {
  syncSportsData,
  placeSportsBet,
} from "@/app/actions/sports-actions";
import { cn } from "@/lib/utils";
import type { SportsMatch, SportsOdds } from "@/types";
import {
  RefreshCw,
  Trophy,
  Calendar,
  Coins,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function MatchCard({
  match,
  currentPlayerId,
  currentBalance,
}: {
  match: SportsMatch;
  currentPlayerId: string | null;
  currentBalance: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState(10);
  const [showExact, setShowExact] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<{
    market: "h2h" | "correct_score";
    label: string;
  } | null>(null);

  const h2hOdds = (match.odds ?? []).filter((o) => o.market === "h2h");
  const csOdds = (match.odds ?? []).filter((o) => o.market === "correct_score");
  const myBets = (match.bets ?? []).filter(
    (b) => b.player_id === currentPlayerId
  );
  const allBets = match.bets ?? [];

  const kickoff = new Date(match.kickoff_at);
  const isUpcoming = match.status === "upcoming";
  const isPast = match.status === "finished";

  function getOddsLabel(label: string): string {
    if (label === "1") return match.home_team;
    if (label === "X") return "Empat";
    if (label === "2") return match.away_team;
    return label;
  }

  function handleBet() {
    if (!selectedMarket) return;
    setError(null);
    startTransition(async () => {
      const res = await placeSportsBet(
        match.id,
        selectedMarket.market,
        selectedMarket.label,
        betAmount
      );
      if (res.error) setError(res.error);
      else setSelectedMarket(null);
    });
  }

  return (
    <Card
      variant={isPast ? "stone" : "parchment"}
      className={cn(isPending && "opacity-50")}
    >
      {/* Match header */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-garamond text-medieval-stone text-xs flex items-center gap-1">
          <Calendar size={10} />
          {kickoff.toLocaleDateString("ca-ES", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}{" "}
          {kickoff.toLocaleTimeString("ca-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span className="font-garamond text-medieval-stone text-xs px-2 py-0.5 bg-medieval-brown/10 rounded-full">
          {match.competition}
        </span>
      </div>

      <div className="flex items-center justify-center gap-3 mb-3">
        <span className="font-cinzel text-medieval-dark font-bold text-sm text-right flex-1">
          {match.home_team}
        </span>
        {isPast ? (
          <span className="font-cinzel text-medieval-gold font-bold text-lg px-3">
            {match.home_score} - {match.away_score}
          </span>
        ) : (
          <span className="font-cinzel text-medieval-stone text-xs px-2">vs</span>
        )}
        <span className="font-cinzel text-medieval-dark font-bold text-sm text-left flex-1">
          {match.away_team}
        </span>
      </div>

      {/* H2H Odds — Quiniela */}
      {h2hOdds.length > 0 && (
        <div className="mb-3">
          <p className="font-cinzel text-medieval-dark text-xs font-semibold mb-1.5">
            Quiniela (1X2)
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {["1", "X", "2"].map((label) => {
              const odd = h2hOdds.find((o) => o.outcome_label === label);
              if (!odd) return null;
              const myBet = myBets.find(
                (b) => b.market === "h2h" && b.outcome_label === label
              );
              const isSelected =
                selectedMarket?.market === "h2h" &&
                selectedMarket?.label === label;

              return (
                <button
                  key={label}
                  onClick={() =>
                    isUpcoming && !myBet
                      ? setSelectedMarket(
                          isSelected
                            ? null
                            : { market: "h2h", label }
                        )
                      : undefined
                  }
                  disabled={!isUpcoming || !!myBet}
                  className={cn(
                    "rounded-medieval border-2 p-2 text-center transition-all",
                    myBet
                      ? myBet.status === "won"
                        ? "border-medieval-green bg-medieval-green/15"
                        : myBet.status === "lost"
                        ? "border-medieval-burgundy/40 bg-medieval-burgundy/10 opacity-60"
                        : "border-medieval-gold bg-medieval-gold/15"
                      : isSelected
                      ? "border-medieval-gold bg-medieval-gold/20 scale-105"
                      : isUpcoming
                      ? "border-medieval-brown/20 bg-parchment-light hover:border-medieval-gold/50 cursor-pointer"
                      : "border-medieval-brown/10 bg-parchment-light opacity-60"
                  )}
                >
                  <span className="block font-garamond text-medieval-stone text-xs">
                    {getOddsLabel(label)}
                  </span>
                  <span className="block font-cinzel text-medieval-dark font-bold text-sm">
                    {Number(odd.odds_decimal).toFixed(2)}
                  </span>
                  {myBet && (
                    <span className="block text-xs font-garamond mt-0.5">
                      <Coins size={8} className="inline" /> {myBet.amount}
                      {myBet.payout > 0 && (
                        <span className="text-medieval-green font-semibold">
                          {" "}
                          +{myBet.payout}
                        </span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Correct Score toggle */}
      {csOdds.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowExact(!showExact)}
            className="flex items-center gap-1 font-cinzel text-medieval-dark text-xs font-semibold mb-1.5 hover:text-medieval-gold transition-colors"
          >
            Resultat exacte
            {showExact ? (
              <ChevronUp size={12} />
            ) : (
              <ChevronDown size={12} />
            )}
          </button>

          {showExact && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1">
              {csOdds
                .sort(
                  (a, b) =>
                    Number(a.odds_decimal) - Number(b.odds_decimal)
                )
                .map((odd) => {
                  const myBet = myBets.find(
                    (b) =>
                      b.market === "correct_score" &&
                      b.outcome_label === odd.outcome_label
                  );
                  const isSelected =
                    selectedMarket?.market === "correct_score" &&
                    selectedMarket?.label === odd.outcome_label;

                  return (
                    <button
                      key={odd.outcome_label}
                      onClick={() =>
                        isUpcoming && !myBet
                          ? setSelectedMarket(
                              isSelected
                                ? null
                                : {
                                    market: "correct_score",
                                    label: odd.outcome_label,
                                  }
                            )
                          : undefined
                      }
                      disabled={!isUpcoming || !!myBet}
                      className={cn(
                        "rounded-medieval border p-1.5 text-center transition-all",
                        myBet
                          ? myBet.status === "won"
                            ? "border-medieval-green bg-medieval-green/15"
                            : myBet.status === "lost"
                            ? "border-medieval-burgundy/40 bg-medieval-burgundy/10 opacity-60"
                            : "border-medieval-gold bg-medieval-gold/15"
                          : isSelected
                          ? "border-medieval-gold bg-medieval-gold/20"
                          : isUpcoming
                          ? "border-medieval-brown/10 hover:border-medieval-gold/40 cursor-pointer"
                          : "border-medieval-brown/10 opacity-50"
                      )}
                    >
                      <span className="block font-cinzel text-xs font-bold text-medieval-dark">
                        {odd.outcome_label}
                      </span>
                      <span className="block font-garamond text-[10px] text-medieval-stone">
                        {Number(odd.odds_decimal).toFixed(1)}
                      </span>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Bet placement */}
      {selectedMarket && isUpcoming && (
        <div className="flex items-center gap-2 p-2 bg-medieval-gold/10 rounded-medieval border border-medieval-gold/30">
          <span className="font-garamond text-medieval-dark text-sm flex-shrink-0">
            {selectedMarket.market === "h2h"
              ? getOddsLabel(selectedMarket.label)
              : selectedMarket.label}
            :
          </span>
          <input
            type="number"
            min={1}
            max={currentBalance}
            value={betAmount}
            onChange={(e) =>
              setBetAmount(Math.max(1, parseInt(e.target.value) || 1))
            }
            className="w-20 px-2 py-1 rounded-medieval border border-medieval-brown/30 bg-parchment-light font-garamond text-sm focus:outline-none focus:border-medieval-gold"
          />
          <span className="font-garamond text-medieval-stone text-xs">
            →{" "}
            {Math.floor(
              betAmount *
                Number(
                  (match.odds ?? []).find(
                    (o) =>
                      o.market === selectedMarket.market &&
                      o.outcome_label === selectedMarket.label
                  )?.odds_decimal ?? 2
                )
            )}{" "}
            pts
          </span>
          <Button
            onClick={handleBet}
            disabled={isPending}
            loading={isPending}
            size="sm"
            variant="primary"
          >
            <Coins size={12} />
            Apostar
          </Button>
        </div>
      )}

      {error && (
        <p className="font-garamond text-red-700 text-xs mt-1">{error}</p>
      )}

      {/* Other players' bets */}
      {allBets.length > 0 && (
        <div className="mt-2 pt-2 border-t border-medieval-brown/20">
          <div className="flex flex-wrap gap-1">
            {allBets.map((bet) => (
              <span
                key={bet.id}
                className={cn(
                  "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-garamond border",
                  bet.status === "won"
                    ? "bg-medieval-green/15 border-medieval-green/30 text-medieval-green"
                    : bet.status === "lost"
                    ? "bg-medieval-burgundy/10 border-medieval-burgundy/20 text-medieval-stone line-through"
                    : "bg-parchment border-medieval-brown/20 text-medieval-stone"
                )}
              >
                <MeepleIcon
                  color={bet.player?.color ?? "#8B4513"}
                  size={10}
                  name={bet.player?.name}
                />
                {bet.player?.name}
                <span className="text-[10px]">
                  {bet.market === "h2h"
                    ? getOddsLabel(bet.outcome_label)
                    : bet.outcome_label}
                </span>
                <Coins size={8} />
                {bet.amount}
                {bet.payout > 0 && (
                  <span className="text-medieval-green font-semibold">
                    +{bet.payout}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export function SportsSection({
  initialMatches,
  initialResults,
  currentPlayerId,
  currentBalance,
}: {
  initialMatches: SportsMatch[];
  initialResults: SportsMatch[];
  currentPlayerId: string | null;
  currentBalance: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [syncError, setSyncError] = useState<string | null>(null);
  const [tab, setTab] = useState<"upcoming" | "results">("upcoming");

  function handleSync() {
    setSyncError(null);
    startTransition(async () => {
      const res = await syncSportsData();
      if (res.error) setSyncError(res.error);
    });
  }

  const matches = tab === "upcoming" ? initialMatches : initialResults;

  return (
    <div className="space-y-4">
      {/* Sync button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          {(["upcoming", "results"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 font-cinzel text-xs font-semibold rounded-medieval border-2 transition-colors",
                tab === t
                  ? "bg-medieval-gold/20 border-medieval-gold text-medieval-gold"
                  : "border-medieval-brown/20 text-medieval-stone hover:border-medieval-gold/40"
              )}
            >
              {t === "upcoming" ? (
                <>
                  <Calendar size={12} />
                  Propers
                </>
              ) : (
                <>
                  <Trophy size={12} />
                  Resultats
                </>
              )}
            </button>
          ))}
        </div>

        <Button
          onClick={handleSync}
          disabled={isPending}
          loading={isPending}
          variant="secondary"
          size="sm"
        >
          <RefreshCw size={12} />
          Sync
        </Button>
      </div>

      {syncError && (
        <Card>
          <p className="font-garamond text-medieval-stone text-sm">
            {syncError.includes("ODDS_API_KEY") ? (
              <>
                Cal afegir <code className="text-medieval-burgundy">ODDS_API_KEY</code> al fitxer{" "}
                <code className="text-medieval-burgundy">.env.local</code>. Registra&apos;t gratis a{" "}
                <span className="text-medieval-blue underline">the-odds-api.com</span> per obtenir-la.
              </>
            ) : (
              syncError
            )}
          </p>
        </Card>
      )}

      {/* Match list */}
      {matches.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-medieval-stone font-garamond">
            <Trophy size={32} className="mx-auto mb-2 opacity-30" />
            {tab === "upcoming" ? (
              <p>Cap partit proper. Prem &quot;Sync&quot; per actualitzar.</p>
            ) : (
              <p>Cap resultat recent.</p>
            )}
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              currentPlayerId={currentPlayerId}
              currentBalance={currentBalance}
            />
          ))}
        </div>
      )}
    </div>
  );
}
