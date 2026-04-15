-- ============================================================
-- Catán Clune — Historical Data Migration
-- Run this in Supabase → SQL Editor
--
-- What this does:
-- 1. Makes `score` nullable (to support historical games without scores)
-- 2. Adds Gaba as player (teal meeple)
-- 3. Inserts all 13 historical games (2025 + 2026)
--
-- Games with full data:   10/01/2026, 25/01/2026
-- Games without scores:   8 games from 2025 + 3 estimated 2026 games
-- Extensions:             All official extensions assumed for all games
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. SCHEMA: make score nullable for historical entries
-- ──────────────────────────────────────────────────────────────
ALTER TABLE game_results ALTER COLUMN score DROP NOT NULL;
ALTER TABLE game_results DROP CONSTRAINT IF EXISTS game_results_score_check;
ALTER TABLE game_results ADD CONSTRAINT game_results_score_check
  CHECK (score IS NULL OR score >= 0);

-- ──────────────────────────────────────────────────────────────
-- 2. PLAYER: add Gaba
-- ──────────────────────────────────────────────────────────────
INSERT INTO players (name, color)
VALUES ('Gaba', '#14B8A6')
ON CONFLICT (name) DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- 3. HISTORICAL GAMES
-- ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  p_marti     UUID;
  p_marcel    UUID;
  p_nacho     UUID;
  p_gaba      UUID;
  p_alejandro UUID;
  p_ivan      UUID;
  p_eudald    UUID;
  gid         UUID;
BEGIN
  SELECT id INTO p_marti     FROM players WHERE name = 'Martí';
  SELECT id INTO p_marcel    FROM players WHERE name = 'Marcel';
  SELECT id INTO p_nacho     FROM players WHERE name = 'Nacho';
  SELECT id INTO p_gaba      FROM players WHERE name = 'Gaba';
  SELECT id INTO p_alejandro FROM players WHERE name = 'Alejandro';
  SELECT id INTO p_ivan      FROM players WHERE name = 'Iván';
  SELECT id INTO p_eudald    FROM players WHERE name = 'Eudald';

  -- ============================================================
  -- 2025 — 8 partides, 7 jugadors, sense puntuació
  -- Victòries: Marcel×3, Nacho×2, Martí×2, Gaba×1
  -- ============================================================

  -- 2025-01-15 · Marcel guanya
  INSERT INTO games (played_at, notes)
    VALUES ('2025-01-15', 'Historial 2025 — sense puntuació registrada')
    RETURNING id INTO gid;
  INSERT INTO game_results (game_id, player_id, score, position) VALUES
    (gid, p_marti, NULL, 2), (gid, p_marcel, NULL, 1), (gid, p_nacho, NULL, 2),
    (gid, p_gaba, NULL, 2), (gid, p_alejandro, NULL, 2),
    (gid, p_ivan, NULL, 2), (gid, p_eudald, NULL, 2);
  INSERT INTO game_extensions (game_id, extension_id)
    SELECT gid, id FROM extensions WHERE is_official = TRUE;

  -- 2025-02-19 · Nacho guanya
  INSERT INTO games (played_at, notes)
    VALUES ('2025-02-19', 'Historial 2025 — sense puntuació registrada')
    RETURNING id INTO gid;
  INSERT INTO game_results (game_id, player_id, score, position) VALUES
    (gid, p_marti, NULL, 2), (gid, p_marcel, NULL, 2), (gid, p_nacho, NULL, 1),
    (gid, p_gaba, NULL, 2), (gid, p_alejandro, NULL, 2),
    (gid, p_ivan, NULL, 2), (gid, p_eudald, NULL, 2);
  INSERT INTO game_extensions (game_id, extension_id)
    SELECT gid, id FROM extensions WHERE is_official = TRUE;

  -- 2025-03-12 · Martí guanya
  INSERT INTO games (played_at, notes)
    VALUES ('2025-03-12', 'Historial 2025 — sense puntuació registrada')
    RETURNING id INTO gid;
  INSERT INTO game_results (game_id, player_id, score, position) VALUES
    (gid, p_marti, NULL, 1), (gid, p_marcel, NULL, 2), (gid, p_nacho, NULL, 2),
    (gid, p_gaba, NULL, 2), (gid, p_alejandro, NULL, 2),
    (gid, p_ivan, NULL, 2), (gid, p_eudald, NULL, 2);
  INSERT INTO game_extensions (game_id, extension_id)
    SELECT gid, id FROM extensions WHERE is_official = TRUE;

  -- 2025-04-16 · Marcel guanya
  INSERT INTO games (played_at, notes)
    VALUES ('2025-04-16', 'Historial 2025 — sense puntuació registrada')
    RETURNING id INTO gid;
  INSERT INTO game_results (game_id, player_id, score, position) VALUES
    (gid, p_marti, NULL, 2), (gid, p_marcel, NULL, 1), (gid, p_nacho, NULL, 2),
    (gid, p_gaba, NULL, 2), (gid, p_alejandro, NULL, 2),
    (gid, p_ivan, NULL, 2), (gid, p_eudald, NULL, 2);
  INSERT INTO game_extensions (game_id, extension_id)
    SELECT gid, id FROM extensions WHERE is_official = TRUE;

  -- 2025-05-14 · Nacho guanya
  INSERT INTO games (played_at, notes)
    VALUES ('2025-05-14', 'Historial 2025 — sense puntuació registrada')
    RETURNING id INTO gid;
  INSERT INTO game_results (game_id, player_id, score, position) VALUES
    (gid, p_marti, NULL, 2), (gid, p_marcel, NULL, 2), (gid, p_nacho, NULL, 1),
    (gid, p_gaba, NULL, 2), (gid, p_alejandro, NULL, 2),
    (gid, p_ivan, NULL, 2), (gid, p_eudald, NULL, 2);
  INSERT INTO game_extensions (game_id, extension_id)
    SELECT gid, id FROM extensions WHERE is_official = TRUE;

  -- 2025-06-18 · Martí guanya
  INSERT INTO games (played_at, notes)
    VALUES ('2025-06-18', 'Historial 2025 — sense puntuació registrada')
    RETURNING id INTO gid;
  INSERT INTO game_results (game_id, player_id, score, position) VALUES
    (gid, p_marti, NULL, 1), (gid, p_marcel, NULL, 2), (gid, p_nacho, NULL, 2),
    (gid, p_gaba, NULL, 2), (gid, p_alejandro, NULL, 2),
    (gid, p_ivan, NULL, 2), (gid, p_eudald, NULL, 2);
  INSERT INTO game_extensions (game_id, extension_id)
    SELECT gid, id FROM extensions WHERE is_official = TRUE;

  -- 2025-09-17 · Marcel guanya
  INSERT INTO games (played_at, notes)
    VALUES ('2025-09-17', 'Historial 2025 — sense puntuació registrada')
    RETURNING id INTO gid;
  INSERT INTO game_results (game_id, player_id, score, position) VALUES
    (gid, p_marti, NULL, 2), (gid, p_marcel, NULL, 1), (gid, p_nacho, NULL, 2),
    (gid, p_gaba, NULL, 2), (gid, p_alejandro, NULL, 2),
    (gid, p_ivan, NULL, 2), (gid, p_eudald, NULL, 2);
  INSERT INTO game_extensions (game_id, extension_id)
    SELECT gid, id FROM extensions WHERE is_official = TRUE;

  -- 2025-11-19 · Gaba guanya
  INSERT INTO games (played_at, notes)
    VALUES ('2025-11-19', 'Historial 2025 — sense puntuació registrada')
    RETURNING id INTO gid;
  INSERT INTO game_results (game_id, player_id, score, position) VALUES
    (gid, p_marti, NULL, 2), (gid, p_marcel, NULL, 2), (gid, p_nacho, NULL, 2),
    (gid, p_gaba, NULL, 1), (gid, p_alejandro, NULL, 2),
    (gid, p_ivan, NULL, 2), (gid, p_eudald, NULL, 2);
  INSERT INTO game_extensions (game_id, extension_id)
    SELECT gid, id FROM extensions WHERE is_official = TRUE;

  -- ============================================================
  -- 2026 — Partides amb puntuació completa
  -- ============================================================

  -- 10/01/2026 · Martí 225, Gaba 218, Marcel 206, Nacho 132
  INSERT INTO games (played_at)
    VALUES ('2026-01-10')
    RETURNING id INTO gid;
  INSERT INTO game_results (game_id, player_id, score, position) VALUES
    (gid, p_marti,  225, 1),
    (gid, p_gaba,   218, 2),
    (gid, p_marcel, 206, 3),
    (gid, p_nacho,  132, 4);
  INSERT INTO game_extensions (game_id, extension_id)
    SELECT gid, id FROM extensions WHERE is_official = TRUE;

  -- 25/01/2026 · Martí 235, Marcel 221, Gaba 175, Eudald 154
  INSERT INTO games (played_at)
    VALUES ('2026-01-25')
    RETURNING id INTO gid;
  INSERT INTO game_results (game_id, player_id, score, position) VALUES
    (gid, p_marti,  235, 1),
    (gid, p_marcel, 221, 2),
    (gid, p_gaba,   175, 3),
    (gid, p_eudald, 154, 4);
  INSERT INTO game_extensions (game_id, extension_id)
    SELECT gid, id FROM extensions WHERE is_official = TRUE;

  -- ============================================================
  -- 2026 — Partides estimades sense puntuació
  -- (per mantenir els totals de victòries i partides correctes)
  -- Martí: 4V/5P  Marcel: 1V/5P  Gaba: 0V/4P  Eudald: 0V/2P  Nacho: 0V/1P
  -- ============================================================

  -- ~22/02/2026 · Martí guanya (Martí, Marcel, Gaba, Eudald)
  INSERT INTO games (played_at, notes)
    VALUES ('2026-02-22', 'Historial 2026 — sense puntuació registrada')
    RETURNING id INTO gid;
  INSERT INTO game_results (game_id, player_id, score, position) VALUES
    (gid, p_marti,  NULL, 1),
    (gid, p_marcel, NULL, 2),
    (gid, p_gaba,   NULL, 2),
    (gid, p_eudald, NULL, 2);
  INSERT INTO game_extensions (game_id, extension_id)
    SELECT gid, id FROM extensions WHERE is_official = TRUE;

  -- ~15/03/2026 · Martí guanya (Martí, Marcel, Gaba)
  INSERT INTO games (played_at, notes)
    VALUES ('2026-03-15', 'Historial 2026 — sense puntuació registrada')
    RETURNING id INTO gid;
  INSERT INTO game_results (game_id, player_id, score, position) VALUES
    (gid, p_marti,  NULL, 1),
    (gid, p_marcel, NULL, 2),
    (gid, p_gaba,   NULL, 2);
  INSERT INTO game_extensions (game_id, extension_id)
    SELECT gid, id FROM extensions WHERE is_official = TRUE;

  -- ~12/04/2026 · Marcel guanya (Martí, Marcel)
  INSERT INTO games (played_at, notes)
    VALUES ('2026-04-12', 'Historial 2026 — sense puntuació registrada')
    RETURNING id INTO gid;
  INSERT INTO game_results (game_id, player_id, score, position) VALUES
    (gid, p_marti,  NULL, 2),
    (gid, p_marcel, NULL, 1);
  INSERT INTO game_extensions (game_id, extension_id)
    SELECT gid, id FROM extensions WHERE is_official = TRUE;

END $$;

-- ──────────────────────────────────────────────────────────────
-- VERIFICATION — expected totals after this script
-- ──────────────────────────────────────────────────────────────
-- SELECT p.name, COUNT(*) AS partides, SUM(CASE WHEN gr.position=1 THEN 1 ELSE 0 END) AS victòries
-- FROM players p
-- JOIN game_results gr ON gr.player_id = p.id
-- GROUP BY p.name ORDER BY victòries DESC;
--
-- Expected:
-- Martí      | 13 | 6
-- Marcel     | 13 | 4
-- Nacho      |  9 | 2
-- Gaba       | 12 | 1
-- Eudald     | 10 | 0
-- Alejandro  |  8 | 0
-- Iván       |  8 | 0
