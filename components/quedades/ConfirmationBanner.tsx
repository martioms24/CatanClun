"use client";

import { useTransition } from "react";
import { respondToQuedada } from "@/app/actions/quedada-actions";
import { Check, X, CalendarHeart } from "lucide-react";

type PendingQuedada = {
  quedadaId: string;
  date: string;
  creatorName: string;
};

export function ConfirmationBanner({
  pending,
}: {
  pending: PendingQuedada[];
}) {
  const [isPending, startTransition] = useTransition();

  if (pending.length === 0) return null;

  function handleRespond(
    quedadaId: string,
    response: "confirmed" | "rejected"
  ) {
    startTransition(async () => {
      await respondToQuedada(quedadaId, response);
    });
  }

  return (
    <div className="bg-medieval-gold/15 border-b-2 border-medieval-gold/30">
      <div className="max-w-5xl mx-auto px-4 py-2 flex flex-col gap-2">
        {pending.map((q) => {
          const dateStr = new Date(q.date + "T00:00:00").toLocaleDateString(
            "ca-ES",
            { day: "numeric", month: "long" }
          );
          return (
            <div
              key={q.quedadaId}
              className="flex items-center gap-3 flex-wrap"
            >
              <CalendarHeart
                size={16}
                className="text-medieval-gold shrink-0"
              />
              <p className="font-garamond text-medieval-dark text-sm flex-1">
                <span className="font-semibold">{q.creatorName}</span> proposa
                quedar el <span className="font-semibold">{dateStr}</span>
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleRespond(q.quedadaId, "confirmed")}
                  disabled={isPending}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-medieval border border-medieval-green/40 bg-medieval-green/10 text-medieval-green hover:bg-medieval-green/20 font-cinzel text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Check size={12} />
                  Confirmar
                </button>
                <button
                  onClick={() => handleRespond(q.quedadaId, "rejected")}
                  disabled={isPending}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-medieval border border-medieval-burgundy/40 bg-medieval-burgundy/10 text-medieval-burgundy hover:bg-medieval-burgundy/20 font-cinzel text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <X size={12} />
                  Rebutjar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
