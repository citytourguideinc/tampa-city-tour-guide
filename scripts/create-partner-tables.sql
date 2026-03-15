-- Run this SQL in your Supabase SQL editor to create the required tables

-- ── Partner Leads ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partner_leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  business      TEXT,
  website       TEXT,
  category      TEXT,
  tier          TEXT NOT NULL DEFAULT 'verified', -- verified, featured, premier
  partner_type  TEXT NOT NULL DEFAULT 'content',  -- content, event, tour
  message       TEXT,
  request_api   BOOLEAN DEFAULT FALSE,
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending, active, cancelled
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Robots Blocked ────────────────────────────────────────────────────────
-- Tracks domains where robots.txt blocked our crawler — pipeline for partner outreach
CREATE TABLE IF NOT EXISTS robots_blocked (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain          TEXT NOT NULL UNIQUE,
  disallow_paths  TEXT[],
  crawl_delay_sec INTEGER,
  notes           TEXT,
  outreach_status TEXT DEFAULT 'pending', -- pending, contacted, partner, opted_out
  checked_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: service role only
ALTER TABLE partner_leads  ENABLE ROW LEVEL SECURITY;
ALTER TABLE robots_blocked ENABLE ROW LEVEL SECURITY;

-- Allow service role to read/write
CREATE POLICY "service_role_all_partner_leads"  ON partner_leads  FOR ALL USING (true);
CREATE POLICY "service_role_all_robots_blocked" ON robots_blocked FOR ALL USING (true);
