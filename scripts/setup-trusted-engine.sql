-- ============================================================
-- Tampa City Tour Guide — Trusted Source Engine Setup v2
-- Run each block in Supabase SQL Editor
-- Project: idxviqopiywzxbmuwtrz
-- IDEMPOTENT: safe to run multiple times
-- ============================================================

-- ── 1. trusted_sources (with health tracking fields) ──────────
create table if not exists trusted_sources (
  id                  uuid primary key default gen_random_uuid(),
  source_name         text not null,
  main_url            text not null,
  domain              text not null unique,
  source_type         text default 'official',
  allowed_depth       int  default 2,
  allowed_paths       text[],
  blocked_paths       text[],
  subsources          jsonb,
  active              boolean default true,
  city                text default 'Tampa',
  -- Health tracking (populated by crawl API)
  last_crawl_at       timestamptz,
  last_crawl_items    int default 0,
  last_crawl_errors   int default 0,
  last_crawl_skipped  int default 0,
  last_crawl_pages    int default 0,
  created_at          timestamptz default now()
);

-- Add health columns if upgrading from v1
alter table trusted_sources add column if not exists last_crawl_at      timestamptz;
alter table trusted_sources add column if not exists last_crawl_items    int default 0;
alter table trusted_sources add column if not exists last_crawl_errors   int default 0;
alter table trusted_sources add column if not exists last_crawl_skipped  int default 0;
alter table trusted_sources add column if not exists last_crawl_pages    int default 0;

-- ── 2. trusted_items (with status review workflow) ────────────
create table if not exists trusted_items (
  id               uuid primary key default gen_random_uuid(),
  source_id        uuid references trusted_sources(id) on delete cascade,
  source_name      text not null,
  source_domain    text not null,
  source_type      text,
  title            text,
  url              text unique not null,
  category         text,
  subcategory      text,
  location         text,
  area             text default 'Downtown',
  price            text,
  event_date       date,
  audience         text[],
  summary          text,
  listing_type     text default 'standard',  -- standard | featured | partner
  status           text default 'pending',   -- pending | approved | hidden
  is_external      boolean default true,
  is_monetized     boolean default false,
  city             text default 'Tampa',
  crawled_at       timestamptz default now(),
  reviewed_at      timestamptz,
  fts              tsvector generated always as (
    to_tsvector('english',
      coalesce(title,'') || ' ' ||
      coalesce(summary,'') || ' ' ||
      coalesce(category,'') || ' ' ||
      coalesce(subcategory, '') || ' ' ||
      coalesce(area,'') || ' ' ||
      coalesce(source_name,'')
    )
  ) stored
);

-- Add status columns if upgrading from v1
alter table trusted_items add column if not exists status    text default 'pending';
alter table trusted_items add column if not exists reviewed_at timestamptz;

-- ── 3. Indexes ────────────────────────────────────────────────
create index if not exists trusted_items_fts      on trusted_items using gin(fts);
create index if not exists trusted_items_source   on trusted_items(source_id);
create index if not exists trusted_items_category on trusted_items(category);
create index if not exists trusted_items_status   on trusted_items(status);
create index if not exists trusted_items_area     on trusted_items(area);
create index if not exists trusted_items_date     on trusted_items(event_date);
create index if not exists trusted_items_city     on trusted_items(city);

-- ── 4. RLS ────────────────────────────────────────────────────
alter table trusted_sources enable row level security;
alter table trusted_items enable row level security;

-- Public: read approved items only (status = approved)
drop policy if exists "Public read trusted_sources" on trusted_sources;
create policy "Public read trusted_sources"
  on trusted_sources for select using (true);

drop policy if exists "Public read trusted_items" on trusted_items;
create policy "Public read trusted_items"
  on trusted_items for select using (status = 'approved');

-- Service role: full access for crawl API
drop policy if exists "Service role trusted_sources" on trusted_sources;
create policy "Service role trusted_sources"
  on trusted_sources for all using (auth.role() = 'service_role');

drop policy if exists "Service role trusted_items" on trusted_items;
create policy "Service role trusted_items"
  on trusted_items for all using (auth.role() = 'service_role');

-- ── 5. Verify ─────────────────────────────────────────────────
select
  'trusted_sources' as table_name,
  count(*) as rows,
  bool_or(column_name = 'last_crawl_at') as has_health_cols
from trusted_sources
cross join information_schema.columns
where table_name = 'trusted_sources'
union all
select
  'trusted_items',
  count(*),
  bool_or(column_name = 'status')
from trusted_items
cross join information_schema.columns
where table_name = 'trusted_items';
