-- ============================================================
-- Forum posts — short messages with title + body
-- ============================================================

CREATE TABLE IF NOT EXISTS forum_posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL CHECK (char_length(title) <= 100),
  body       TEXT NOT NULL CHECK (char_length(body) <= 300),
  author_id  UUID NOT NULL REFERENCES players(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON forum_posts(created_at DESC);

ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read forum_posts"
  ON forum_posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert forum_posts"
  ON forum_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete forum_posts"
  ON forum_posts FOR DELETE USING (auth.role() = 'authenticated');
