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
  created_at: string;
  resolved_at: string | null;
};

// Quedadas (meetups)
export type QuedadaStatus = "pending" | "confirmed" | "rejected";

export type Quedada = {
  id: string;
  date: string;
  description: string | null;
  created_by: string;
  status: QuedadaStatus;
  created_at: string;
  // joined
  creator?: Player;
  participants?: QuedadaParticipant[];
};

export type QuedadaParticipant = {
  id: string;
  quedada_id: string;
  player_id: string;
  status: QuedadaStatus;
  responded_at: string | null;
  // joined
  player?: Player;
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
