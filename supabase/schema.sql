-- ============================================================
-- Catan Clun — Carcassonne Score Tracker
-- Supabase / PostgreSQL Schema
-- ============================================================

-- Extensions (official + custom)
CREATE TABLE IF NOT EXISTS extensions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  is_official BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fixed 6 players (linked to auth.users via user_id)
CREATE TABLE IF NOT EXISTS players (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  color      TEXT NOT NULL DEFAULT '#8B4513',
  user_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Games
CREATE TABLE IF NOT EXISTS games (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  played_at  DATE NOT NULL DEFAULT CURRENT_DATE,
  notes      TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-update updated_at on games
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Game results (one row per player per game)
CREATE TABLE IF NOT EXISTS game_results (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id   UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  score     INTEGER NOT NULL CHECK (score >= 0),
  position  INTEGER NOT NULL CHECK (position >= 1),
  UNIQUE(game_id, player_id)
);

-- Game ↔ Extensions join
CREATE TABLE IF NOT EXISTS game_extensions (
  game_id      UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  extension_id UUID NOT NULL REFERENCES extensions(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, extension_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE extensions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE players       ENABLE ROW LEVEL SECURITY;
ALTER TABLE games         ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results  ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_extensions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read everything
CREATE POLICY "Authenticated users can read extensions"
  ON extensions FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert extensions"
  ON extensions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read players"
  ON players FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read games"
  ON games FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert games"
  ON games FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update games"
  ON games FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete games"
  ON games FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read game_results"
  ON game_results FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert game_results"
  ON game_results FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update game_results"
  ON game_results FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete game_results"
  ON game_results FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read game_extensions"
  ON game_extensions FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert game_extensions"
  ON game_extensions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete game_extensions"
  ON game_extensions FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- Seed: 6 fixed players + official extensions
-- ============================================================

INSERT INTO players (name, color) VALUES
  ('Martí',      '#E53E3E'),
  ('Marcel',     '#3182CE'),
  ('Alejandro',  '#38A169'),
  ('Nacho',      '#D69E2E'),
  ('Eudald',     '#805AD5'),
  ('Iván',       '#DD6B20')
ON CONFLICT (name) DO NOTHING;

INSERT INTO extensions (name, is_official, description) VALUES
  ('Inns & Cathedrals',       TRUE, 'Inns double road points, Cathedrals boost cities — but score 0 if incomplete'),
  ('Traders & Builders',      TRUE, 'Trade goods, Builder for extra turns, Pig for bigger farm scoring'),
  ('The Princess & The Dragon', TRUE, 'Dragon devours meeples, Princess evicts knights, portal lets you place anywhere'),
  ('The Tower',                TRUE, 'Towers capture opponent meeples for ransom'),
  ('Abbey & Mayor',           TRUE, 'Abbey fills gaps, Mayor strength = pennants, Wagon moves on completion'),
  ('Count, King & Robber',    TRUE, 'King holds largest city; Robber Baron holds longest road; both score at end'),
  ('Bridges, Castles & Bazaars', TRUE, 'Bridges extend roads, Castles copy neighbour scores, Bazaars auction tiles'),
  ('Hills & Sheep',           TRUE, 'Shepherd collects sheep tokens; Wolf eats your flock; Hills break ties'),
  ('Under the Big Top',       TRUE, 'Circus Big Top, acrobat pyramids, and the Ringmaster meeple'),
  ('The River',               TRUE, 'River tiles form the starting spine before normal play begins'),
  ('The Cult',                TRUE, 'Cult places compete against adjacent monasteries'),
  ('Mage & Witch',            TRUE, 'Mage doubles scoring on features; Witch halves it')
ON CONFLICT (name) DO NOTHING;
