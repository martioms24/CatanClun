-- ============================================================
-- Catán Clun — Push subscriptions (Web Push notifications)
-- Run this in Supabase → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx
  ON push_subscriptions(user_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Each user only sees / manages their own subscriptions.
-- (The server-side action uses the service role to send pushes
-- to every subscription, bypassing RLS.)
CREATE POLICY "Users read own subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);
