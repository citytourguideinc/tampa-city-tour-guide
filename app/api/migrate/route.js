// app/api/migrate/route.js
// POST /api/migrate — creates trusted_sources + trusted_items tables with full schema
// Protected by CRAWL_SECRET or ADMIN_SECRET header
// Safe to call multiple times (uses CREATE TABLE IF NOT EXISTS)
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

function authCheck(request) {
  const secret = process.env.CRAWL_SECRET || process.env.ADMIN_SECRET;
  if (!secret) return true; // open in dev if no secret set
  const h = request.headers.get('x-crawl-secret') || request.headers.get('x-admin-secret');
  return h === secret;
}

// Full schema SQL — idempotent (IF NOT EXISTS everywhere)
const MIGRATION_SQL = [
  // ── trusted_sources ──────────────────────────────────────────
  `create table if not exists trusted_sources (
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
    last_crawl_at    timestamptz,
    last_crawl_items int  default 0,
    last_crawl_errors int default 0,
    last_crawl_skipped int default 0,
    last_crawl_pages int  default 0,
    created_at       timestamptz default now()
  )`,

  // ── trusted_items ─────────────────────────────────────────────
  `create table if not exists trusted_items (
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
    status           text default 'pending',
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
        coalesce(subcategory,'') || ' ' ||
        coalesce(area,'') || ' ' ||
        coalesce(source_name,'')
      )
    ) stored
  )`,

  // ── Indexes ────────────────────────────────────────────────────
  `create index if not exists trusted_items_fts      on trusted_items using gin(fts)`,
  `create index if not exists trusted_items_source   on trusted_items(source_id)`,
  `create index if not exists trusted_items_category on trusted_items(category)`,
  `create index if not exists trusted_items_status   on trusted_items(status)`,
  `create index if not exists trusted_items_area     on trusted_items(area)`,
  `create index if not exists trusted_items_date     on trusted_items(event_date)`,
  `create index if not exists trusted_items_city     on trusted_items(city)`,

  // ── RLS policies ───────────────────────────────────────────────
  `alter table trusted_sources enable row level security`,
  `alter table trusted_items enable row level security`,
];

const RLS_POLICIES = [
  `do $$ begin
    if not exists (select 1 from pg_policies where tablename='trusted_sources' and policyname='Public read trusted_sources') then
      create policy "Public read trusted_sources" on trusted_sources for select using (true);
    end if;
  end $$`,
  `do $$ begin
    if not exists (select 1 from pg_policies where tablename='trusted_items' and policyname='Public read trusted_items') then
      create policy "Public read trusted_items" on trusted_items for select using (approved_only());
    end if;
  end $$`,
  `do $$ begin
    if not exists (select 1 from pg_policies where tablename='trusted_sources' and policyname='Service role trusted_sources') then
      create policy "Service role trusted_sources" on trusted_sources for all using (auth.role()='service_role');
    end if;
  end $$`,
  `do $$ begin
    if not exists (select 1 from pg_policies where tablename='trusted_items' and policyname='Service role trusted_items') then
      create policy "Service role trusted_items" on trusted_items for all using (auth.role()='service_role');
    end if;
  end $$`,
];

export async function POST(request) {
  if (!authCheck(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'Service role key not configured. Set SUPABASE_SERVICE_ROLE_KEY.' }, { status: 503 });

  const results = [];
  const errors  = [];

  for (const sql of MIGRATION_SQL) {
    const label = sql.trim().slice(0, 60).replace(/\s+/g, ' ');
    const { error } = await admin.rpc('exec_sql', { sql_query: sql }).catch(() => ({ error: { message: 'rpc not available' } }));

    if (error) {
      // Try alternate approach: use the REST API directly
      errors.push({ sql: label, error: error.message });
    } else {
      results.push({ sql: label, ok: true });
    }
  }

  // Verify tables exist after migration attempt
  const { data: sourceCheck, error: srcErr } = await admin.from('trusted_sources').select('id').limit(1);
  const { data: itemCheck,   error: itmErr } = await admin.from('trusted_items').select('id').limit(1);

  const tablesExist = {
    trusted_sources: !srcErr,
    trusted_items:   !itmErr,
    source_error:    srcErr?.message,
    item_error:      itmErr?.message,
  };

  return NextResponse.json({
    migration_attempted: results.length + errors.length,
    succeeded: results.length,
    failed: errors.length,
    errors,
    tables_exist: tablesExist,
    message: tablesExist.trusted_sources && tablesExist.trusted_items
      ? '✅ Both tables confirmed accessible'
      : '⚠️ Tables may need to be created manually. See scripts/setup-trusted-engine.sql',
  });
}

export async function GET(request) {
  if (!authCheck(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'Service role key not configured' }, { status: 503 });

  const { data: s, error: srcErr } = await admin.from('trusted_sources').select('count').limit(1);
  const { data: i, error: itmErr } = await admin.from('trusted_items').select('count').limit(1);
  const { count: srcCount }        = await admin.from('trusted_sources').select('*', {count:'exact',head:true});
  const { count: itmCount }        = await admin.from('trusted_items').select('*', {count:'exact',head:true});

  return NextResponse.json({
    trusted_sources: { exists: !srcErr, count: srcCount || 0, error: srcErr?.message },
    trusted_items:   { exists: !itmErr, count: itmCount || 0, error: itmErr?.message },
  });
}
