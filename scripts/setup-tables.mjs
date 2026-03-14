#!/usr/bin/env node
// scripts/setup-tables.mjs — Creates Supabase tables via direct SQL query API
// Tries multiple Supabase endpoints to execute DDL statements
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
try {
  const lines = readFileSync(resolve(__dirname, '../.env.local'), 'utf8').split('\n');
  for (const line of lines) {
    const [k, ...rest] = line.split('=');
    if (k && !k.startsWith('#') && rest.length) process.env[k.trim()] = rest.join('=').trim();
  }
} catch { console.error('Could not load .env.local'); process.exit(1); }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log(`Supabase URL: ${SUPABASE_URL}`);
console.log(`Service key type: ${SERVICE_KEY?.startsWith('eyJ') ? 'JWT' : SERVICE_KEY?.startsWith('sb_') ? 'sb_secret' : 'unknown'}`);
console.log(`Service key length: ${SERVICE_KEY?.length}`);

// SQL statements to execute
const SQL_BLOCKS = [
  {
    name: 'Create trusted_sources',
    sql: `create table if not exists trusted_sources (
      id uuid primary key default gen_random_uuid(),
      source_name text not null, main_url text not null, domain text not null unique,
      source_type text default 'official', allowed_depth int default 2,
      allowed_paths text[], blocked_paths text[], subsources jsonb,
      active boolean default true, city text default 'Tampa',
      last_crawl_at timestamptz, last_crawl_items int default 0,
      last_crawl_errors int default 0, last_crawl_skipped int default 0,
      last_crawl_pages int default 0, created_at timestamptz default now()
    )`
  },
  {
    name: 'Create trusted_items',
    sql: `create table if not exists trusted_items (
      id uuid primary key default gen_random_uuid(),
      source_id uuid references trusted_sources(id) on delete cascade,
      source_name text not null, source_domain text not null, source_type text,
      title text, url text unique not null, category text, subcategory text,
      location text, area text default 'Downtown', price text, event_date date,
      audience text[], summary text, listing_type text default 'standard',
      status text default 'pending', is_external boolean default true,
      is_monetized boolean default false, city text default 'Tampa',
      crawled_at timestamptz default now(), reviewed_at timestamptz,
      fts tsvector generated always as (to_tsvector('english',
        coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' ||
        coalesce(category,'') || ' ' || coalesce(subcategory,'') || ' ' ||
        coalesce(area,'') || ' ' || coalesce(source_name,'')
      )) stored
    )`
  },
  {
    name: 'Create indexes',
    sql: `create index if not exists trusted_items_fts on trusted_items using gin(fts);
      create index if not exists trusted_items_source on trusted_items(source_id);
      create index if not exists trusted_items_category on trusted_items(category);
      create index if not exists trusted_items_status on trusted_items(status);
      create index if not exists trusted_items_area on trusted_items(area);
      create index if not exists trusted_items_date on trusted_items(event_date);
      create index if not exists trusted_items_city on trusted_items(city)`
  },
  {
    name: 'Enable RLS',
    sql: `alter table trusted_sources enable row level security;
      alter table trusted_items enable row level security`
  },
  {
    name: 'Create RLS policies for trusted_sources',
    sql: `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='trusted_sources' AND policyname='Public read trusted_sources') THEN
        CREATE POLICY "Public read trusted_sources" ON trusted_sources FOR SELECT USING (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='trusted_sources' AND policyname='Service role trusted_sources') THEN
        CREATE POLICY "Service role trusted_sources" ON trusted_sources FOR ALL USING (auth.role() = 'service_role');
      END IF;
    END $$`
  },
  {
    name: 'Create RLS policies for trusted_items',
    sql: `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='trusted_items' AND policyname='Public read trusted_items') THEN
        CREATE POLICY "Public read trusted_items" ON trusted_items FOR SELECT USING (status = 'approved');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='trusted_items' AND policyname='Service role trusted_items') THEN
        CREATE POLICY "Service role trusted_items" ON trusted_items FOR ALL USING (auth.role() = 'service_role');
      END IF;
    END $$`
  },
];

// Try multiple approaches to run SQL
async function tryRunSQL(sql, name) {
  const key = SERVICE_KEY || ANON_KEY;

  // Approach 1: Supabase pg/query endpoint (works with service role JWT)
  const endpoints = [
    { url: `${SUPABASE_URL}/rest/v1/rpc/exec_sql`, body: { sql_query: sql }, method: 'POST' },
    { url: `${SUPABASE_URL}/pg/query`, body: { query: sql }, method: 'POST' },
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        method: ep.method,
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ep.body),
      });
      const text = await res.text();
      if (res.ok) {
        console.log(`  ✅ ${name} — via ${ep.url.split('/').slice(-2).join('/')}`);
        return true;
      }
      // Don't log 404s for endpoints that don't exist
      if (res.status !== 404) {
        console.log(`  ⚠️  ${ep.url.split('/').slice(-2).join('/')}: ${res.status} ${text.slice(0,120)}`);
      }
    } catch (err) {
      // skip
    }
  }
  return false;
}

console.log('\n══ Running SQL Setup ══════════════════════════════\n');

let anySuccess = false;
for (const block of SQL_BLOCKS) {
  const ok = await tryRunSQL(block.sql, block.name);
  if (ok) anySuccess = true;
}

// Verify tables
console.log('\n══ Verifying Tables ═══════════════════════════════\n');
const key = SERVICE_KEY || ANON_KEY;
for (const table of ['trusted_sources', 'trusted_items']) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id&limit=1`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
    });
    if (res.ok) console.log(`  ✅ ${table} — accessible`);
    else console.log(`  ❌ ${table} — ${res.status} ${(await res.text()).slice(0,100)}`);
  } catch (err) {
    console.log(`  ❌ ${table} — ${err.message}`);
  }
}

if (!anySuccess) {
  console.log('\n⚠️  Could not execute SQL via API. The service role key may not support SQL execution.');
  console.log('   You need to run the SQL manually in the Supabase SQL Editor.');
  console.log('   URL: https://supabase.com/dashboard/project/idxviqopiywzxbmuwtrz/sql/new');
  console.log('   File: scripts/setup-trusted-engine.sql\n');
}
