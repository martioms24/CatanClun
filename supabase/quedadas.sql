-- ============================================================
-- Quedadas (meetups) — group meetup tracking with confirmations
-- ============================================================

-- Quedadas table
CREATE TABLE IF NOT EXISTS quedadas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE NOT NULL,
  description TEXT,
  created_by  UUID NOT NULL REFERENCES players(id),
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'confirmed', 'rejected')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Participants for each quedada
CREATE TABLE IF NOT EXISTS quedada_participants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quedada_id   UUID NOT NULL REFERENCES quedadas(id) ON DELETE CASCADE,
  player_id    UUID NOT NULL REFERENCES players(id),
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'confirmed', 'rejected')),
  responded_at TIMESTAMPTZ,
  UNIQUE(quedada_id, player_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quedadas_date ON quedadas(date DESC);
CREATE INDEX IF NOT EXISTS idx_quedadas_status ON quedadas(status);
CREATE INDEX IF NOT EXISTS idx_quedada_participants_player ON quedada_participants(player_id);
CREATE INDEX IF NOT EXISTS idx_quedada_participants_status ON quedada_participants(status);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE quedadas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE quedada_participants  ENABLE ROW LEVEL SECURITY;

-- Quedadas policies
CREATE POLICY "Authenticated users can read quedadas"
  ON quedadas FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert quedadas"
  ON quedadas FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update quedadas"
  ON quedadas FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete quedadas"
  ON quedadas FOR DELETE USING (auth.role() = 'authenticated');

-- Participants policies
CREATE POLICY "Authenticated users can read quedada_participants"
  ON quedada_participants FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert quedada_participants"
  ON quedada_participants FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update quedada_participants"
  ON quedada_participants FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete quedada_participants"
  ON quedada_participants FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- Trigger: auto-update quedada status based on participant responses
-- When all participants have responded:
--   - If all confirmed → quedada status = 'confirmed'
--   - If any rejected → quedada status = 'rejected'
-- ============================================================

CREATE OR REPLACE FUNCTION update_quedada_status()
RETURNS TRIGGER AS $$
DECLARE
  total_count   INT;
  pending_count INT;
  rejected_count INT;
BEGIN
  SELECT COUNT(*),
         COUNT(*) FILTER (WHERE status = 'pending'),
         COUNT(*) FILTER (WHERE status = 'rejected')
  INTO total_count, pending_count, rejected_count
  FROM quedada_participants
  WHERE quedada_id = NEW.quedada_id;

  IF rejected_count > 0 THEN
    UPDATE quedadas SET status = 'rejected' WHERE id = NEW.quedada_id;
  ELSIF pending_count = 0 AND total_count > 0 THEN
    UPDATE quedadas SET status = 'confirmed' WHERE id = NEW.quedada_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER quedada_participant_status_change
  AFTER UPDATE OF status ON quedada_participants
  FOR EACH ROW EXECUTE FUNCTION update_quedada_status();
