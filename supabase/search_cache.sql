-- Search result cache for federated API results (1 hour TTL)
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New query → paste → Run
CREATE TABLE IF NOT EXISTS search_cache (
  query_key   text PRIMARY KEY,
  results     jsonb NOT NULL DEFAULT '[]',
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- Index to quickly find + purge expired entries
CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON search_cache(expires_at);

-- Allow public read (results are non-sensitive)
ALTER TABLE search_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cache" ON search_cache FOR SELECT USING (true);
