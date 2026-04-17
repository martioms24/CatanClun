-- ============================================================
-- Mini-games: Sports betting, Slots (Book of Ra), Mines
-- ============================================================

-- ── Sports matches (cached from The Odds API) ──────────────
CREATE TABLE IF NOT EXISTS sports_matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_match_id    TEXT UNIQUE NOT NULL,
  home_team       TEXT NOT NULL,
  away_team       TEXT NOT NULL,
  competition     TEXT NOT NULL,
  kickoff_at      TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'upcoming'
                    CHECK (status IN ('upcoming', 'live', 'finished', 'cancelled')),
  home_score      INTEGER,
  away_score      INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sports_matches_status ON sports_matches(status);
CREATE INDEX IF NOT EXISTS idx_sports_matches_kickoff ON sports_matches(kickoff_at);

-- ── Sports odds (cached) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS sports_odds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        UUID NOT NULL REFERENCES sports_matches(id) ON DELETE CASCADE,
  market          TEXT NOT NULL CHECK (market IN ('h2h', 'correct_score')),
  outcome_label   TEXT NOT NULL,
  odds_decimal    NUMERIC(8,2) NOT NULL CHECK (odds_decimal > 1),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, market, outcome_label)
);

CREATE INDEX IF NOT EXISTS idx_sports_odds_match ON sports_odds(match_id);

-- ── Sports bets (player wagers on matches) ─────────────────
CREATE TABLE IF NOT EXISTS sports_bets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        UUID NOT NULL REFERENCES sports_matches(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id),
  market          TEXT NOT NULL CHECK (market IN ('h2h', 'correct_score')),
  outcome_label   TEXT NOT NULL,
  amount          INTEGER NOT NULL CHECK (amount > 0),
  odds_at_bet     NUMERIC(8,2) NOT NULL,
  payout          INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'won', 'lost', 'cancelled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sports_bets_player ON sports_bets(player_id);
CREATE INDEX IF NOT EXISTS idx_sports_bets_match ON sports_bets(match_id);

-- ── Slots games ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS slots_games (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id         UUID NOT NULL REFERENCES players(id),
  wager             INTEGER NOT NULL CHECK (wager > 0),
  payout            INTEGER NOT NULL DEFAULT 0,
  reels             JSONB NOT NULL,         -- 5x3 grid: [[row0,row1,row2], ...]
  winning_lines     JSONB,                  -- array of {line, symbols, payout}
  is_free_spin      BOOLEAN NOT NULL DEFAULT FALSE,
  session_id        UUID,                   -- links free spins together
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slots_games_player ON slots_games(player_id);
CREATE INDEX IF NOT EXISTS idx_slots_games_date ON slots_games(created_at);

-- ── Slots free-spin sessions ───────────────────────────────
CREATE TABLE IF NOT EXISTS slots_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id           UUID NOT NULL REFERENCES players(id),
  free_spins_remaining INTEGER NOT NULL DEFAULT 10,
  expanding_symbol    INTEGER NOT NULL,       -- symbol index that expands
  base_wager          INTEGER NOT NULL,       -- wager from the triggering spin
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slots_sessions_player ON slots_sessions(player_id);

-- ── Mines games ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mines_games (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       UUID NOT NULL REFERENCES players(id),
  wager           INTEGER NOT NULL CHECK (wager > 0),
  num_mines       INTEGER NOT NULL CHECK (num_mines >= 1 AND num_mines <= 24),
  mine_positions  JSONB NOT NULL,            -- array of mine cell indices [0-24]
  revealed        JSONB NOT NULL DEFAULT '[]', -- array of revealed cell indices
  payout          INTEGER NOT NULL DEFAULT 0,
  multiplier      NUMERIC(10,4) NOT NULL DEFAULT 1.0,
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'cashed_out', 'exploded')),
  server_seed     TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mines_games_player ON mines_games(player_id);
CREATE INDEX IF NOT EXISTS idx_mines_games_date ON mines_games(created_at);
CREATE INDEX IF NOT EXISTS idx_mines_games_status ON mines_games(status);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE sports_matches  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_odds     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_bets     ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots_games     ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE mines_games     ENABLE ROW LEVEL SECURITY;

-- Sports matches: anyone authenticated can read, insert, update
CREATE POLICY "Auth read sports_matches" ON sports_matches FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth insert sports_matches" ON sports_matches FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update sports_matches" ON sports_matches FOR UPDATE USING (auth.role() = 'authenticated');

-- Sports odds
CREATE POLICY "Auth read sports_odds" ON sports_odds FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth insert sports_odds" ON sports_odds FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update sports_odds" ON sports_odds FOR UPDATE USING (auth.role() = 'authenticated');

-- Sports bets
CREATE POLICY "Auth read sports_bets" ON sports_bets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth insert sports_bets" ON sports_bets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update sports_bets" ON sports_bets FOR UPDATE USING (auth.role() = 'authenticated');

-- Slots games
CREATE POLICY "Auth read slots_games" ON slots_games FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth insert slots_games" ON slots_games FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update slots_games" ON slots_games FOR UPDATE USING (auth.role() = 'authenticated');

-- Slots sessions
CREATE POLICY "Auth read slots_sessions" ON slots_sessions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth insert slots_sessions" ON slots_sessions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update slots_sessions" ON slots_sessions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete slots_sessions" ON slots_sessions FOR DELETE USING (auth.role() = 'authenticated');

-- Mines games
CREATE POLICY "Auth read mines_games" ON mines_games FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth insert mines_games" ON mines_games FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update mines_games" ON mines_games FOR UPDATE USING (auth.role() = 'authenticated');
