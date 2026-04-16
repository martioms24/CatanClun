-- ============================================================
-- Catán Clune — Plans (to-do list grupal)
-- Run this in Supabase → SQL Editor
-- ============================================================

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'done', 'discarded')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ
);

-- Trigger: set resolved_at when status changes away from 'pending'
CREATE OR REPLACE FUNCTION plans_set_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status <> 'pending' AND (OLD.status = 'pending' OR OLD.status IS NULL) THEN
    NEW.resolved_at = NOW();
  ELSIF NEW.status = 'pending' THEN
    NEW.resolved_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS plans_resolved_at ON plans;
CREATE TRIGGER plans_resolved_at
  BEFORE INSERT OR UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION plans_set_resolved_at();

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read plans"
  ON plans FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert plans"
  ON plans FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update plans"
  ON plans FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete plans"
  ON plans FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- Seed plans
-- ============================================================
INSERT INTO plans (title) VALUES
  ('Paintball'),
  ('Humor Amarillo'),
  ('Ruta pel País Basc'),
  ('Sessió de fotos dels 90s repeinaos'),
  ('Anar directe de la Nit a la Mola'),
  ('Sessió de 8 hores de Carcassone (formal dresscode)'),
  ('Jugar un Catan a dalt d''una montanya'),
  ('Presentació de Què fas a la feina'),
  ('Concurs de Tapes'),
  ('Calçotada'),
  ('Barbacoa'),
  ('Anar a esquiar'),
  ('No parar ni un finde'),
  ('Trip to Rome with the gang'),
  ('Barbequiu/calçotada casa Eudald'),
  ('Marató de pel·lícules de Lord of the Rings'),
  ('Karting'),
  ('Cata de vins'),
  ('Torneig oficial de bàsquet de Catán Clune 3x3')
ON CONFLICT DO NOTHING;
