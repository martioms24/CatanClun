export type Player = {
  id: string;
  name: string;
  color: string;
  user_id: string | null;
  created_at: string;
};

export type Extension = {
  id: string;
  name: string;
  is_official: boolean;
  description: string | null;
  created_at: string;
};

export type Game = {
  id: string;
  played_at: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  results?: GameResult[];
  extensions?: Extension[];
};

export type GameResult = {
  id: string;
  game_id: string;
  player_id: string;
  score: number | null; // NULL for historical games without recorded scores
  position: number;
  // joined
  player?: Player;
};

export type PlayerStats = {
  player: Player;
  games_played: number;
  wins: number;
  win_rate: number;
  avg_score: number;
  best_score: number;
  best_score_game_id: string | null;
  current_streak: number;
  longest_streak: number;
  total_score: number;
  podium_count: number;
};

export type ExtensionWinRate = {
  extension: Extension;
  games_played: number;
  wins: number;
  win_rate: number;
};

export type NewGamePayload = {
  played_at: string;
  notes?: string;
  results: { player_id: string; score: number; position: number }[];
  extension_ids: string[];
};

export type PlanStatus = "pending" | "done" | "discarded";

export type Plan = {
  id: string;
  title: string;
  status: PlanStatus;
  points: number;
  created_at: string;
  resolved_at: string | null;
  // joined
  completions?: PlanCompletion[];
};

export type PlanCompletion = {
  id: string;
  plan_id: string;
  player_id: string;
  // joined
  player?: Player;
};

// Quedadas (meetups)
export type QuedadaType = "default" | "escalar" | "festa" | "platja" | "barbacoa" | "custom";

export type Quedada = {
  id: string;
  date: string;
  description: string | null;
  created_by: string;
  status: string;
  type: QuedadaType;
  points: number;
  created_at: string;
  // joined
  creator?: Player;
  participants?: QuedadaParticipant[];
};

export type QuedadaParticipant = {
  id: string;
  quedada_id: string;
  player_id: string;
  status: string;
  responded_at: string | null;
  // joined
  player?: Player;
};

// Rewards
export type RewardType = "birra" | "cubata" | "tiktok" | "sopar";

export type Redemption = {
  id: string;
  reward_type: RewardType;
  cost: number;
  redeemed_by: string;
  target_player: string | null;
  description: string | null;
  status: "pending" | "completed";
  created_at: string;
  completed_at: string | null;
  // joined
  redeemer?: Player;
  target?: Player;
};

// Forum posts
export type ForumPost = {
  id: string;
  title: string;
  body: string;
  author_id: string;
  created_at: string;
  author?: Player;
};

// Gambling
export type BetStatus = "open" | "closed" | "resolved";

export type Bet = {
  id: string;
  title: string;
  created_by: string;
  status: BetStatus;
  winning_option_id: string | null;
  created_at: string;
  resolved_at: string | null;
  // joined
  creator?: Player;
  options?: BetOption[];
  wagers?: BetWager[];
};

export type BetOption = {
  id: string;
  bet_id: string;
  label: string;
};

export type BetWager = {
  id: string;
  bet_id: string;
  option_id: string;
  player_id: string;
  amount: number;
  payout: number;
  created_at: string;
  // joined
  player?: Player;
};

export type PlayerPoints = {
  player: Player;
  earned: number;       // from activity
  wagered: number;      // total bet
  won: number;          // total payouts
  balance: number;      // earned - wagered + won
};

// Forum activity
export type ActivityItem = {
  type: "game" | "quedada" | "plan" | "bet_created" | "bet_resolved";
  date: string;
  title: string;
  description?: string;
  link?: string;
};

// Profile stats
export type QuedadaStats = {
  total_attended: number;
  total_invited: number;
  upcoming: number;
  frequent_partners: { player: Player; count: number }[];
};

export type AwardWin = {
  year: number;
  category: string;
  emoji: string;
};

// Cims (peaks)
export type PeakCompletion = {
  id: string;
  peak_name: string;
  completed_at: string;
  created_at: string;
  // joined
  players?: Player[];
};

// ── Sports betting ─────────────────────────────────────────
export type SportsMatch = {
  id: string;
  api_match_id: string;
  home_team: string;
  away_team: string;
  competition: string;
  kickoff_at: string;
  status: "upcoming" | "live" | "finished" | "cancelled";
  home_score: number | null;
  away_score: number | null;
  created_at: string;
  updated_at: string;
  // joined
  odds?: SportsOdds[];
  bets?: SportsBet[];
};

export type SportsOdds = {
  id: string;
  match_id: string;
  market: "h2h" | "correct_score";
  outcome_label: string;
  odds_decimal: number;
  updated_at: string;
};

export type SportsBet = {
  id: string;
  match_id: string;
  player_id: string;
  market: "h2h" | "correct_score";
  outcome_label: string;
  amount: number;
  odds_at_bet: number;
  payout: number;
  status: "pending" | "won" | "lost" | "cancelled";
  created_at: string;
  // joined
  player?: Player;
};

// ── Slots ──────────────────────────────────────────────────
export type SlotsGame = {
  id: string;
  player_id: string;
  wager: number;
  payout: number;
  reels: number[][]; // 5 reels × 3 rows
  winning_lines: WinningLine[] | null;
  is_free_spin: boolean;
  session_id: string | null;
  created_at: string;
};

export type WinningLine = {
  line: number;
  symbols: number[];
  payout: number;
};

export type SlotsSession = {
  id: string;
  player_id: string;
  free_spins_remaining: number;
  expanding_symbol: number;
  base_wager: number;
  created_at: string;
};

export type SlotSpinResult = {
  reels: number[][];         // 5×3 grid
  winningLines: WinningLine[];
  totalPayout: number;
  scatterCount: number;
  freeSpinsAwarded: number;
  expandingSymbol: number | null;
  freeSpinsRemaining: number;
  isFreeSpin: boolean;
  gameId: string;
};

// ── Mines ──────────────────────────────────────────────────
export type MinesGame = {
  id: string;
  player_id: string;
  wager: number;
  num_mines: number;
  mine_positions: number[];  // hidden from client until game ends
  revealed: number[];
  payout: number;
  multiplier: number;
  status: "active" | "cashed_out" | "exploded";
  server_seed: string;
  created_at: string;
};

export type MinesGameState = {
  id: string;
  wager: number;
  num_mines: number;
  revealed: number[];
  multiplier: number;
  nextMultiplier: number;
  status: "active" | "cashed_out" | "exploded";
  payout: number;
  minePositions?: number[];  // only revealed after game ends
};
