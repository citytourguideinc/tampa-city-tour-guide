-- ============================================================
-- Tampa City Tour Guide — Trusted Source Engine Setup
-- Run each block separately in Supabase SQL Editor
-- Project: tampa-city-tour-guide (idxviqopiywzxbmuwtrz)
-- ============================================================

-- ── 1. Trusted Sources Registry ──────────────────────────────
create table if not exists trusted_sources (
  id               uuid primary key default gen_random_uuid(),
  source_name      text not null,
  main_url         text not null,
  domain           text not null unique,
  source_type      text default 'official',
  allowed_depth    int  default 2,
  allowed_paths    text[],
  blocked_paths    text[],
  subsources       jsonb,
  active           boolean default true,
  city             text default 'Tampa',
  created_at       timestamptz default now()
);

-- ── 2. Trusted Items (extracted results) ─────────────────────
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
  listing_type     text default 'standard',
  is_external      boolean default true,
  is_monetized     boolean default false,
  city             text default 'Tampa',
  crawled_at       timestamptz default now(),
  fts              tsvector generated always as (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(summary, '') || ' ' ||
      coalesce(category, '') || ' ' ||
      coalesce(subcategory, '') || ' ' ||
      coalesce(area, '') || ' ' ||
      coalesce(source_name, '')
    )
  ) stored
);

-- ── 3. Indexes ────────────────────────────────────────────────
create index if not exists trusted_items_fts      on trusted_items using gin(fts);
create index if not exists trusted_items_source   on trusted_items(source_id);
create index if not exists trusted_items_category on trusted_items(category);
create index if not exists trusted_items_area     on trusted_items(area);
create index if not exists trusted_items_date     on trusted_items(event_date);
create index if not exists trusted_items_city     on trusted_items(city);

-- ── 4. RLS — Allow public reads, restrict writes to service role ──
alter table trusted_sources enable row level security;
alter table trusted_items enable row level security;

create policy "Public can read trusted_sources"
  on trusted_sources for select using (true);

create policy "Public can read trusted_items"
  on trusted_items for select using (true);

-- Service role (used by crawl API) can do everything
create policy "Service role full access to trusted_sources"
  on trusted_sources for all using (auth.role() = 'service_role');

create policy "Service role full access to trusted_items"
  on trusted_items for all using (auth.role() = 'service_role');

-- ── 5. Verify setup ───────────────────────────────────────────
select 'trusted_sources' as table_name, count(*) from trusted_sources
union all
select 'trusted_items',                  count(*) from trusted_items;
