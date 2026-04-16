// ============================================================
// Awards / Votacions — static data for each year
// ============================================================

export type AwardResult = {
  name: string;
  votes: number;
};

export type AwardCategory = {
  title: string;
  emoji: string;
  results: AwardResult[];
  totalVotes: number;
};

export type AwardsYearData = {
  year: number;
  categories: AwardCategory[];
  comingSoon?: boolean;
};

/** Consistent colors for people across all awards */
export const PERSON_COLORS: Record<string, string> = {
  Martí: "#E53E3E",
  Marcelo: "#3182CE",
  Marcel: "#3182CE",
  Alejandro: "#38A169",
  Nacho: "#D69E2E",
  "Eudaldo el Farras": "#805AD5",
  Ivan: "#DD6B20",
  "Marc Gaba": "#14B8A6",
  "Ignasi Vera": "#DB2777",
};

function cat(
  title: string,
  emoji: string,
  results: [string, number][],
): AwardCategory {
  const sorted = results.sort((a, b) => b[1] - a[1]);
  const totalVotes = sorted.reduce((s, r) => s + r[1], 0);
  return {
    title,
    emoji,
    results: sorted.map(([name, votes]) => ({ name, votes })),
    totalVotes,
  };
}

// ────────────────────────────────────────────
// 2024
// ────────────────────────────────────────────
const awards2024: AwardsYearData = {
  year: 2024,
  categories: [
    cat("El més borracho", "🍺", [
      ["Marcelo", 4],
      ["Alejandro", 1],
      ["Ignasi Vera", 1],
      ["Eudaldo el Farras", 1],
    ]),
    cat("El més primo", "🤦", [
      ["Alejandro", 4],
      ["Martí", 2],
      ["Ignasi Vera", 1],
    ]),
    cat("El més adicte a la dopamina", "📱", [
      ["Ignasi Vera", 3],
      ["Marc Gaba", 3],
      ["Eudaldo el Farras", 1],
    ]),
    cat("El més putero", "😈", [
      ["Eudaldo el Farras", 6],
      ["Ivan", 1],
    ]),
    cat("El més influencer/tiktoker", "📸", [
      ["Marcelo", 6],
      ["Ignasi Vera", 1],
    ]),
    cat("El més real", "💯", [
      ["Ivan", 2],
      ["Martí", 2],
      ["Marcelo", 1],
      ["Eudaldo el Farras", 1],
      ["Marc Gaba", 1],
    ]),
    cat("El més dormilón", "😴", [
      ["Marc Gaba", 4],
      ["Ivan", 3],
    ]),
    cat("El més gay", "🏳️‍🌈", [
      ["Martí", 3],
      ["Alejandro", 2],
      ["Ivan", 1],
      ["Eudaldo el Farras", 1],
    ]),
    cat("El més pajero", "🫣", [
      ["Martí", 4],
      ["Ivan", 2],
      ["Eudaldo el Farras", 1],
    ]),
    cat("El més autista", "🧩", [
      ["Marc Gaba", 4],
      ["Ivan", 1],
      ["Martí", 1],
      ["Eudaldo el Farras", 1],
    ]),
    cat("El més fit", "💪", [
      ["Ivan", 5],
      ["Ignasi Vera", 1],
      ["Martí", 1],
    ]),
    cat("El més Fashion", "👔", [
      ["Ivan", 4],
      ["Marc Gaba", 3],
    ]),
    cat("El millor jugador de Catan", "🏆", [
      ["Martí", 3],
      ["Ignasi Vera", 2],
      ["Marcelo", 1],
      ["Marc Gaba", 1],
    ]),
    cat("El més culón", "🍑", [
      ["Marcelo", 6],
      ["Ignasi Vera", 1],
    ]),
  ],
};

// ────────────────────────────────────────────
// 2025
// ────────────────────────────────────────────
const awards2025: AwardsYearData = {
  year: 2025,
  categories: [
    cat("El més primo", "🤦", [
      ["Martí", 3],
      ["Alejandro", 3],
      ["Ignasi Vera", 1],
    ]),
    cat("El més borracho", "🍺", [
      ["Martí", 5],
      ["Ignasi Vera", 1],
      ["Eudaldo el Farras", 1],
    ]),
    cat("El més real", "💯", [
      ["Marcelo", 4],
      ["Martí", 2],
      ["Eudaldo el Farras", 1],
    ]),
    cat("El més adicte a la dopamina", "📱", [
      ["Marc Gaba", 3],
      ["Ignasi Vera", 3],
      ["Eudaldo el Farras", 1],
    ]),
    cat("El més putero", "😈", [
      ["Eudaldo el Farras", 5],
      ["Martí", 2],
    ]),
    cat("El millor vlogger/influencer", "📸", [
      ["Ignasi Vera", 6],
      ["Ivan", 1],
    ]),
    cat("El més correa", "🐕", [
      ["Alejandro", 5],
      ["Marcelo", 1],
      ["Marc Gaba", 1],
    ]),
    cat("El més gay", "🏳️‍🌈", [
      ["Martí", 5],
      ["Ignasi Vera", 1],
      ["Ivan", 1],
    ]),
    cat("El més pajero", "🫣", [
      ["Martí", 6],
      ["Ignasi Vera", 1],
    ]),
    cat("El més autista", "🧩", [
      ["Marc Gaba", 7],
    ]),
    cat("El que ha canviat més", "🔄", [
      ["Ivan", 6],
      ["Ignasi Vera", 1],
    ]),
    cat("El més inpuntual", "⏰", [
      ["Ivan", 4],
      ["Alejandro", 2],
      ["Ignasi Vera", 1],
    ]),
    cat("El millor jugador de Carcassone", "🏆", [
      ["Ignasi Vera", 3],
      ["Martí", 1],
      ["Ivan", 1],
      ["Marc Gaba", 1],
      ["Marcelo", 1],
    ]),
    cat("El que procrastina més", "🦥", [
      ["Alejandro", 3],
      ["Ignasi Vera", 1],
      ["Martí", 1],
      ["Marcelo", 1],
      ["Eudaldo el Farras", 1],
    ]),
    cat("El que més plans ha proposat", "📋", [
      ["Marcelo", 5],
      ["Martí", 2],
    ]),
    cat("El més pupas", "🤕", [
      ["Marcel", 6],
      ["Nacho", 1],
    ]),
    cat("El que ha fet més coses productives", "⚡", [
      ["Ivan", 3],
      ["Eudaldo el Farras", 3],
      ["Marcelo", 1],
    ]),
    cat("El que ha tingut més moments èpics", "🎬", [
      ["Martí", 3],
      ["Ignasi Vera", 2],
      ["Marcelo", 1],
      ["Eudaldo el Farras", 1],
    ]),
    cat("El que ha sigut més meme", "😂", [
      ["Martí", 3],
      ["Ignasi Vera", 3],
      ["Marc Gaba", 1],
    ]),
    cat("Qui ha tingut més sort?", "🍀", [
      ["Ivan", 3],
      ["Martí", 2],
      ["Ignasi Vera", 1],
      ["Marc Gaba", 1],
    ]),
    cat("Qui ha tingut més mala sort?", "☠️", [
      ["Marc Gaba", 2],
      ["Eudaldo el Farras", 2],
      ["Alejandro", 2],
      ["Marcelo", 1],
    ]),
    cat("El que té més dependència de ChatGPT", "🤖", [
      ["Marcelo", 3],
      ["Ignasi Vera", 2],
      ["Ivan", 1],
      ["Martí", 1],
    ]),
  ],
};

// ────────────────────────────────────────────
// 2026 — coming soon
// ────────────────────────────────────────────
const awards2026: AwardsYearData = {
  year: 2026,
  categories: [],
  comingSoon: true,
};

export const AVAILABLE_YEARS = [2024, 2025, 2026] as const;
export const DEFAULT_YEAR = 2025;

/**
 * Maps player.name (DB) → names used in awards voting data.
 * A player can appear under multiple names across years.
 */
export const PLAYER_AWARD_NAMES: Record<string, string[]> = {
  Martí: ["Martí"],
  Marcel: ["Marcelo", "Marcel"],
  Alejandro: ["Alejandro"],
  Nacho: ["Nacho"],
  Eudald: ["Eudaldo el Farras"],
  Iván: ["Ivan"],
  Gaba: ["Marc Gaba"],
};

export function getAwardsForYear(year: number): AwardsYearData | null {
  const map: Record<number, AwardsYearData> = {
    2024: awards2024,
    2025: awards2025,
    2026: awards2026,
  };
  return map[year] ?? null;
}
