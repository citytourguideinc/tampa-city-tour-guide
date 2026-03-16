-- scripts/setup-manual-tables.sql
-- Run this in Supabase SQL Editor to create tables for manual entries (Activities & Vendors)

-- 1. Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  activity_name     TEXT NOT NULL,
  category          TEXT NOT NULL,
  neighborhood      TEXT,
  city              TEXT DEFAULT 'Tampa',
  short_summary     TEXT,
  long_description  TEXT,
  booking_link      TEXT,
  official_link     TEXT,
  google_maps_link  TEXT,
  icon              TEXT DEFAULT '📍',
  source_name       TEXT,
  active_status     BOOLEAN DEFAULT TRUE,
  featured_status   BOOLEAN DEFAULT FALSE,
  price_range       TEXT,
  event_date        DATE
);

-- 2. Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  vendor_name       TEXT NOT NULL,
  contact_name      TEXT,
  email             TEXT,
  phone             TEXT,
  website           TEXT,
  category          TEXT,
  claim_status      TEXT DEFAULT 'unclaimed', -- 'unclaimed' | 'pending' | 'verified'
  paid_status       TEXT DEFAULT 'free',      -- 'free' | 'pro' | 'enterprise'
  admin_notes       TEXT
);

-- 3. Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (Example: Public can read active, Service role can do everything)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='activities' AND policyname='Public read active activities') THEN
    CREATE POLICY "Public read active activities" ON activities FOR SELECT USING (active_status = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='activities' AND policyname='Service role full access activities') THEN
    CREATE POLICY "Service role full access activities" ON activities FOR ALL USING (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendors' AND policyname='Public read vendors') THEN
    CREATE POLICY "Public read vendors" ON vendors FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendors' AND policyname='Service role full access vendors') THEN
    CREATE POLICY "Service role full access vendors" ON vendors FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;
