-- ============================================================
-- Gambling — Betting system with points economy
-- ============================================================

-- Bets (a question/event to bet on)
CREATE TABLE IF NOT EXISTS bets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  created_by        UUID NOT NULL REFERENCES players(id),
  status            TEXT NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open', 'closed', 'resolved')),
  winning_option_id UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at       TIMESTAMPTZ
);

-- Options for each bet
CREATE TABLE IF NOT EXISTS bet_options (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id  UUID NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
  label   TEXT NOT NULL
);

-- Add FK for winning_option_id after bet_options exists
ALTER TABLE bets
  ADD CONSTRAINT fk_bets_winning_option
  FOREIGN KEY (winning_option_id) REFERENCES bet_options(id);

-- Wagers placed by players
CREATE TABLE IF NOT EXISTS bet_wagers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id     UUID NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
  option_id  UUID NOT NULL REFERENCES bet_options(id),
  player_id  UUID NOT NULL REFERENCES players(id),
  amount     INTEGER NOT NULL CHECK (amount > 0),
  payout     INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(bet_id, option_id, player_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
CREATE INDEX IF NOT EXISTS idx_bets_created_by ON bets(created_by);
CREATE INDEX IF NOT EXISTS idx_bet_options_bet ON bet_options(bet_id);
CREATE INDEX IF NOT EXISTS idx_bet_wagers_player ON bet_wagers(player_id);
CREATE INDEX IF NOT EXISTS idx_bet_wagers_bet ON bet_wagers(bet_id);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE bets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_options     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_wagers      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read bets"
  ON bets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert bets"
  ON bets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update bets"
  ON bets FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete bets"
  ON bets FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read bet_options"
  ON bet_options FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert bet_options"
  ON bet_options FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete bet_options"
  ON bet_options FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read bet_wagers"
  ON bet_wagers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert bet_wagers"
  ON bet_wagers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update bet_wagers"
  ON bet_wagers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete bet_wagers"
  ON bet_wagers FOR DELETE USING (auth.role() = 'authenticated');
