// ── Book of Ra–style slots configuration ────────────────────
// 5 reels × 3 visible rows, 9 paylines, 8 symbols

export const SLOTS_ROWS = 3;
export const SLOTS_REELS = 5;
export const SLOTS_PAYLINES = 9;
export const MAX_DAILY_SPINS = 50;
export const FREE_SPINS_COUNT = 10;
export const HOUSE_EDGE = 0.04; // 4% house edge → ~96% RTP

// ── Symbol definitions ──────────────────────────────────────
// Index 0-6 = friends (low→legendary), 7 = book (wild+scatter)

export type SlotSymbol = {
  id: number;
  name: string;
  image: string;
  tier: "low" | "mid" | "high" | "legendary" | "book";
};

export const SYMBOLS: SlotSymbol[] = [
  { id: 0, name: "Guerrer", image: "/slots/s1.png", tier: "low" },
  { id: 1, name: "Mag", image: "/slots/s2.png", tier: "low" },
  { id: 2, name: "Arquera", image: "/slots/s3.png", tier: "mid" },
  { id: 3, name: "Cavaller", image: "/slots/s4.png", tier: "mid" },
  { id: 4, name: "Druida", image: "/slots/s5.png", tier: "high" },
  { id: 5, name: "Princesa", image: "/slots/s6.png", tier: "high" },
  { id: 6, name: "Rei", image: "/slots/s7.png", tier: "legendary" },
  { id: 7, name: "El Llibre", image: "/slots/book.png", tier: "book" },
];

export const BOOK_SYMBOL = 7;

// ── Payout table ────────────────────────────────────────────
// Key: symbolId, Value: [match3, match4, match5] payouts per line bet
// Book pays for 2+ matches as scatter (anywhere on reels)
export const PAYOUTS: Record<number, number[]> = {
  0: [5, 25, 100],       // low
  1: [5, 25, 100],       // low
  2: [10, 40, 150],      // mid
  3: [10, 40, 150],      // mid
  4: [20, 100, 500],     // high
  5: [20, 100, 500],     // high
  6: [30, 200, 1000],    // legendary
  7: [18, 90, 900],      // book (scatter payout)
};

// Book scatter pays for 2+ (unlike regular symbols which need 3+)
export const BOOK_SCATTER_PAYOUTS: Record<number, number> = {
  2: 2,
  3: 18,
  4: 90,
  5: 900,
};

// ── Paylines (row indices for each reel position) ───────────
// Each payline is [reel0_row, reel1_row, reel2_row, reel3_row, reel4_row]
// Rows: 0=top, 1=middle, 2=bottom
export const PAYLINE_PATTERNS: number[][] = [
  [1, 1, 1, 1, 1], // Line 1: middle
  [0, 0, 0, 0, 0], // Line 2: top
  [2, 2, 2, 2, 2], // Line 3: bottom
  [0, 1, 2, 1, 0], // Line 4: V shape
  [2, 1, 0, 1, 2], // Line 5: inverted V
  [0, 0, 1, 2, 2], // Line 6: diagonal down
  [2, 2, 1, 0, 0], // Line 7: diagonal up
  [1, 0, 0, 0, 1], // Line 8: shallow W top
  [1, 2, 2, 2, 1], // Line 9: shallow W bottom
];

// ── Reel strips ─────────────────────────────────────────────
// Each reel has a strip of symbols. The RNG picks a stop position,
// and 3 consecutive symbols become the visible window.
// Carefully weighted for ~96% RTP.

export const REEL_STRIPS: number[][] = [
  // Reel 1 (32 positions)
  [0, 1, 2, 0, 3, 1, 0, 4, 2, 1, 0, 5, 3, 1, 0, 2, 6, 0, 1, 3, 0, 2, 1, 4, 0, 7, 3, 2, 1, 5, 0, 1],
  // Reel 2 (32 positions)
  [1, 0, 3, 2, 0, 1, 0, 4, 2, 5, 0, 1, 3, 0, 2, 1, 6, 0, 3, 1, 0, 2, 7, 1, 0, 4, 2, 3, 0, 1, 5, 0],
  // Reel 3 (32 positions)
  [2, 0, 1, 3, 0, 4, 1, 0, 2, 1, 5, 0, 3, 2, 0, 1, 0, 6, 1, 0, 2, 3, 0, 1, 7, 4, 0, 2, 1, 0, 3, 5],
  // Reel 4 (32 positions)
  [0, 2, 1, 0, 3, 4, 0, 1, 2, 0, 5, 1, 0, 3, 2, 6, 0, 1, 0, 2, 3, 0, 1, 4, 7, 0, 2, 1, 5, 3, 0, 1],
  // Reel 5 (32 positions)
  [1, 0, 2, 3, 0, 1, 4, 0, 2, 1, 0, 5, 3, 0, 1, 2, 0, 6, 1, 3, 0, 2, 0, 1, 4, 0, 7, 2, 3, 1, 0, 5],
];

// ── Tier colors for UI ──────────────────────────────────────
export const TIER_COLORS: Record<string, string> = {
  low: "border-medieval-stone/40",
  mid: "border-medieval-blue/50",
  high: "border-medieval-burgundy/50",
  legendary: "border-medieval-gold",
  book: "border-medieval-gold ring-2 ring-medieval-gold/30",
};

export const TIER_BG: Record<string, string> = {
  low: "bg-medieval-stone/10",
  mid: "bg-medieval-blue/10",
  high: "bg-medieval-burgundy/10",
  legendary: "bg-medieval-gold/20",
  book: "bg-medieval-gold/30",
};
