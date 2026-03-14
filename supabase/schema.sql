-- City Tour Guide V2 — Supabase Schema
-- Run this in the Supabase SQL Editor at supabase.com → your project → SQL Editor

-- ── Core ─────────────────────────────────────────────────────────
CREATE TABLE activities (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_name    text NOT NULL,
  category         text NOT NULL,
  city             text NOT NULL DEFAULT 'Tampa',
  neighborhood     text,
  short_summary    text,
  source_type      text,         -- 'curated' | 'vendor' | 'affiliate'
  source_name      text,         -- 'Viator' | 'GetYourGuide' | 'Official'
  booking_link     text,
  official_link    text,
  icon             text,         -- emoji
  lat              numeric,
  lng              numeric,
  featured_status  boolean DEFAULT false,
  active_status    boolean DEFAULT true,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id    uuid REFERENCES activities(id) ON DELETE CASCADE,
  event_date     date,
  start_time     time,
  end_time       time,
  recurring_flag text          -- 'daily' | 'weekly' | 'monthly' | null
);

CREATE TABLE tours (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id       uuid REFERENCES activities(id) ON DELETE CASCADE,
  duration          text,          -- '2 hours' | '3-4 hours'
  starting_location text,
  price_min         numeric,
  price_max         numeric,
  booking_required  boolean DEFAULT true
);

CREATE TABLE tags (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_name text UNIQUE NOT NULL
);

CREATE TABLE activity_tags (
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  tag_id      uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (activity_id, tag_id)
);

-- ── Vendors & Revenue ─────────────────────────────────────────────
CREATE TABLE vendors (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name  text NOT NULL,
  contact_name text,
  email        text,
  phone        text,
  claim_status text DEFAULT 'unclaimed',   -- 'unclaimed' | 'pending' | 'claimed'
  paid_status  text DEFAULT 'free',        -- 'free' | 'featured' | 'premium'
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE deals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id  uuid REFERENCES activities(id) ON DELETE CASCADE,
  vendor_id    uuid REFERENCES vendors(id) ON DELETE SET NULL,
  deal_title   text NOT NULL,
  deal_details text,
  start_date   date,
  end_date     date
);

-- ── Users & Analytics ─────────────────────────────────────────────
CREATE TABLE user_preferences (
  user_id              uuid PRIMARY KEY,
  city                 text DEFAULT 'Tampa',
  preferred_categories text[],
  preferred_times      text[],
  preferred_areas      text[]
);

CREATE TABLE clicks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid,
  activity_id    uuid REFERENCES activities(id) ON DELETE SET NULL,
  clicked_at     timestamptz DEFAULT now(),
  source_clicked text          -- 'search' | 'filter' | 'featured' | 'ai'
);

-- ── Indexes ───────────────────────────────────────────────────────
CREATE INDEX ON activities(city);
CREATE INDEX ON activities(category);
CREATE INDEX ON activities(featured_status);
CREATE INDEX ON activities(active_status);
CREATE INDEX ON events(activity_id);
CREATE INDEX ON events(event_date);
CREATE INDEX ON clicks(activity_id);

-- ── Full-text search ──────────────────────────────────────────────
ALTER TABLE activities ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(activity_name,'') || ' ' ||
      coalesce(category,'') || ' ' ||
      coalesce(neighborhood,'') || ' ' ||
      coalesce(short_summary,'')
    )
  ) STORED;
CREATE INDEX ON activities USING GIN(fts);

-- ── Row Level Security ────────────────────────────────────────────
ALTER TABLE activities       ENABLE ROW LEVEL SECURITY;
ALTER TABLE events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags              ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_tags     ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors           ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks            ENABLE ROW LEVEL SECURITY;

-- Public read for all active activities
CREATE POLICY "Public read active" ON activities FOR SELECT USING (active_status = true);
CREATE POLICY "Public read events"  ON events  FOR SELECT USING (true);
CREATE POLICY "Public read tours"   ON tours   FOR SELECT USING (true);
CREATE POLICY "Public read tags"    ON tags    FOR SELECT USING (true);
CREATE POLICY "Public read activity_tags" ON activity_tags FOR SELECT USING (true);
CREATE POLICY "Public read deals"   ON deals   FOR SELECT USING (true);
