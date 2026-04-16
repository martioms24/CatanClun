-- ============================================================
-- Rewards — redeem points for real-world rewards
-- ============================================================

CREATE TABLE IF NOT EXISTS redemptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_type   TEXT NOT NULL CHECK (reward_type IN ('birra', 'cubata', 'tiktok', 'sopar')),
  cost          INTEGER NOT NULL CHECK (cost > 0),
  redeemed_by   UUID NOT NULL REFERENCES players(id),
  target_player UUID REFERENCES players(id),
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'completed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_redemptions_redeemed_by ON redemptions(redeemed_by);
CREATE INDEX IF NOT EXISTS idx_redemptions_target ON redemptions(target_player);

ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read redemptions"
  ON redemptions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert redemptions"
  ON redemptions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update redemptions"
  ON redemptions FOR UPDATE USING (auth.role() = 'authenticated');
