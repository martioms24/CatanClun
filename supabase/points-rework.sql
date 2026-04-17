-- ═══════════════════════════════════════════════════════════
-- Points rework migration
-- ═══════════════════════════════════════════════════════════

-- ── 1. Quedadas: add type + points, remove approval flow ──

-- Add type and points columns
ALTER TABLE quedadas ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'default';
ALTER TABLE quedadas ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 4;

-- Set all existing quedadas to confirmed (no more approval flow)
UPDATE quedadas SET status = 'confirmed' WHERE status != 'confirmed';

-- Set all existing participants to confirmed
UPDATE quedada_participants SET status = 'confirmed', responded_at = NOW()
WHERE status != 'confirmed';

-- Drop the auto-status trigger (no longer needed)
DROP TRIGGER IF EXISTS update_quedada_status ON quedada_participants;
DROP FUNCTION IF EXISTS update_quedada_status_fn();

-- ── 2. Plans: add points + completions tracking ──────────

ALTER TABLE plans ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 10;

CREATE TABLE IF NOT EXISTS plan_completions (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id   UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  UNIQUE(plan_id, player_id)
);

ALTER TABLE plan_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read plan_completions"
  ON plan_completions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert plan_completions"
  ON plan_completions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete plan_completions"
  ON plan_completions FOR DELETE TO authenticated USING (true);
