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
