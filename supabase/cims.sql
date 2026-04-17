-- Peak completions: tracks which players completed which peaks
CREATE TABLE IF NOT EXISTS peak_completions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peak_name     TEXT NOT NULL,
  completed_at  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Many-to-many: which players were on each completion
CREATE TABLE IF NOT EXISTS peak_completion_players (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  completion_id   UUID NOT NULL REFERENCES peak_completions(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  UNIQUE(completion_id, player_id)
);

-- RLS
ALTER TABLE peak_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE peak_completion_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read peak_completions"
  ON peak_completions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert peak_completions"
  ON peak_completions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete peak_completions"
  ON peak_completions FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read peak_completion_players"
  ON peak_completion_players FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert peak_completion_players"
  ON peak_completion_players FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete peak_completion_players"
  ON peak_completion_players FOR DELETE TO authenticated USING (true);
