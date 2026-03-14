#!/usr/bin/env node
// scripts/validate-and-crawl.mjs
// Run: node scripts/validate-and-crawl.mjs
// Validates Supabase tables exist, runs a dry-run crawl, then a live crawl.
// Uses credentials from .env.local automatically.

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ─────────────────────────────────────────────────────────
const envPath = resolve(__dirname, '../.env.local');
try {
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const [k, ...rest] = line.split('=');
    if (k && !k.startsWith('#') && rest.length) {
      process.env[k.trim()] = rest.join('=').trim();
    }
  }
  console.log('✅ Loaded .env.local');
} catch { console.error('❌ Could not load .env.local — ensure it exists with SUPABASE credentials'); process.exit(1); }

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const HEADERS = {
  'apikey':        SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type':  'application/json',
  'Prefer':        'return=representation',
};

// ── Step 1: Check tables ─────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════');
console.log(' STEP 1: Checking Supabase tables');
console.log('══════════════════════════════════════════');

async function checkTable(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, { headers: HEADERS });
  if (res.ok) {
    const data = await res.json();
    console.log(`✅ ${table}: exists (${data.length} rows returned in test query)`);
    return true;
  } else {
    const txt = await res.text();
    console.log(`❌ ${table}: NOT FOUND — ${res.status} ${txt.slice(0, 120)}`);
    return false;
  }
}

const srcExists = await checkTable('trusted_sources');
const itmExists = await checkTable('trusted_items');

if (!srcExists || !itmExists) {
  console.log('\n⚠️  Tables missing. You must run the SQL setup first.');
  console.log('   Open Supabase SQL Editor → paste contents of:');
  console.log('   scripts/setup-trusted-engine.sql');
  console.log('\n   Then re-run this script.');
  process.exit(1);
}

// ── Step 2: Dry-run crawl ─────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════');
console.log(' STEP 2: Dry-run crawl (no DB writes)');
console.log('══════════════════════════════════════════');

// Import crawler + extractor directly
const { crawlSource } = await import('../lib/crawler.js').catch(e => {
  console.error('❌ Cannot import crawler:', e.message); process.exit(1);
});
const { extractPage } = await import('../lib/extractor.js').catch(e => {
  console.error('❌ Cannot import extractor:', e.message); process.exit(1);
});
const SOURCES = JSON.parse(readFileSync(resolve(__dirname, '../lib/trusted-sources.json'), 'utf8'));
const source  = SOURCES.find(s => s.active);

if (!source) { console.error('❌ No active sources in trusted-sources.json'); process.exit(1); }

console.log(`\nCrawling: ${source.sourceName} (${source.mainUrl})`);
console.log(`Domain: ${source.domain} | Depth: ${source.allowedDepth}`);
console.log(`Subsources: ${(source.subsources||[]).map(s => s.url).join(', ')}\n`);

const { pages, diagnostics } = await crawlSource(source);

console.log('── Crawl Diagnostics ──────────────────────────────────');
console.log(`Pages visited:       ${diagnostics.pagesVisited}`);
console.log(`Pages skipped:       ${diagnostics.pagesSkipped}`);
console.log(`Links found:         ${diagnostics.totalLinksFound}`);
console.log(`Fetch errors:        ${diagnostics.fetchErrors.length}`);
console.log(`Blocked paths hit:   ${diagnostics.blockedPathsHit.length}`);
console.log(`Duration:            ${diagnostics.durationMs}ms`);

if (diagnostics.blockedPathsHit.length > 0) {
  console.log('\nBlocked paths:');
  diagnostics.blockedPathsHit.slice(0, 5).forEach(b => console.log(`  [${b.reason}] ${b.url}`));
}

if (diagnostics.fetchErrors.length > 0) {
  console.log('\nFetch errors (sample):');
  diagnostics.fetchErrors.slice(0, 3).forEach(e => console.log(`  ${e}`));
}

// ── Step 3: Extract + show sample ─────────────────────────────────────────────
console.log('\n── Extraction Results ─────────────────────────────────');
let extracted = 0, skippedTitle = 0, skippedCat = 0, fieldReport = {};

for (const { url, html, subsource } of pages) {
  const item = extractPage(html, url, source, subsource);

  if (!item.title || item.title.length < 3)  { skippedTitle++; continue; }
  if (!item.category)                         { skippedCat++;   continue; }

  extracted++;

  // Count field populations
  for (const [k, v] of Object.entries(item)) {
    if (!fieldReport[k]) fieldReport[k] = { populated: 0, missing: 0 };
    const has = v && (Array.isArray(v) ? v.length > 0 : true);
    if (has) fieldReport[k].populated++;
    else     fieldReport[k].missing++;
  }
}

console.log(`\nExtraction success:  ${extracted} / ${pages.length} pages`);
console.log(`Skipped (no title):  ${skippedTitle}`);
console.log(`Skipped (no cat):    ${skippedCat}`);
console.log(`Success rate:        ${pages.length > 0 ? Math.round((extracted/pages.length)*100) : 0}%`);

console.log('\nField population rates:');
for (const [field, counts] of Object.entries(fieldReport)) {
  const total = counts.populated + counts.missing;
  const pct   = Math.round((counts.populated / total) * 100);
  const bar   = '█'.repeat(Math.round(pct/10)) + '░'.repeat(10 - Math.round(pct/10));
  console.log(`  ${field.padEnd(14)} ${bar} ${pct}% (${counts.populated}/${total})`);
}

// Show first 3 items
console.log('\nSample extracted items:');
let shown = 0;
for (const { url, html, subsource } of pages) {
  if (shown >= 3) break;
  const item = extractPage(html, url, source, subsource);
  if (!item.title || item.title.length < 3 || !item.category) continue;
  shown++;
  console.log(`\n  [${shown}] ${item.title}`);
  console.log(`      URL:        ${item.url}`);
  console.log(`      Category:   ${item.category}${item.subcategory ? ' › ' + item.subcategory : ''}`);
  console.log(`      Price:      ${item.price || '(not found)'}`);
  console.log(`      Date:       ${item.event_date || '(not found)'}`);
  console.log(`      Area:       ${item.area || '(not found)'}`);
  console.log(`      Summary:    ${(item.summary || '(not found)').slice(0,100)}`);
  console.log(`      Audience:   ${(item.audience||[]).join(', ') || '(not found)'}`);
}

// ── Step 4: Ask to proceed with live crawl ────────────────────────────────────
const args = process.argv.slice(2);
if (args.includes('--dry-run')) {
  console.log('\n✅ Dry run complete. Re-run without --dry-run to write to Supabase.\n');
  process.exit(0);
}

console.log('\n══════════════════════════════════════════');
console.log(' STEP 3: Writing to Supabase (LIVE)');
console.log('══════════════════════════════════════════\n');

let written = 0, dupes = 0, writeErrors = [];

// Register source if needed
const srcCheck = await fetch(`${SUPABASE_URL}/rest/v1/trusted_sources?domain=eq.${source.domain}&select=id`, { headers: HEADERS });
const srcData  = await srcCheck.json();
let sourceId   = srcData[0]?.id;

if (!sourceId) {
  const ins = await fetch(`${SUPABASE_URL}/rest/v1/trusted_sources`, {
    method: 'POST', headers: HEADERS,
    body: JSON.stringify({ source_name: source.sourceName, main_url: source.mainUrl, domain: source.domain,
      source_type: source.sourceType, allowed_depth: source.allowedDepth, blocked_paths: source.blockedPaths,
      subsources: source.subsources, active: source.active, city: source.city }),
  });
  const insData = await ins.json();
  sourceId = insData[0]?.id || insData?.id;
  console.log(`✅ Registered source in DB: ${sourceId}`);
} else {
  console.log(`✅ Source already registered: ${sourceId}`);
}

for (const { url, html, subsource } of pages) {
  const item = extractPage(html, url, source, subsource);
  if (!item.title || item.title.length < 3 || !item.category) continue;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/trusted_items`, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      source_id: sourceId, source_name: item.source_name, source_domain: item.source_domain,
      source_type: item.source_type, title: item.title, url: item.url,
      category: item.category, subcategory: item.subcategory, location: item.location,
      area: item.area, price: item.price, event_date: item.event_date,
      audience: item.audience, summary: item.summary,
      listing_type: 'standard', status: 'pending',
      is_external: true, is_monetized: false, city: item.city,
      crawled_at: new Date().toISOString(),
    }),
  });

  if (res.ok || res.status === 409) {
    if (res.status === 409) dupes++;
    else written++;
  } else {
    writeErrors.push(`${res.status}: ${url}`);
  }
}

// Update source health
await fetch(`${SUPABASE_URL}/rest/v1/trusted_sources?id=eq.${sourceId}`, {
  method: 'PATCH', headers: HEADERS,
  body: JSON.stringify({ last_crawl_at: new Date().toISOString(), last_crawl_items: written,
    last_crawl_errors: writeErrors.length, last_crawl_pages: diagnostics.pagesVisited }),
});

console.log('\n── Live Crawl Results ─────────────────────────────────');
console.log(`Items written to Supabase: ${written}`);
console.log(`Duplicates skipped:        ${dupes}`);
console.log(`Write errors:              ${writeErrors.length}`);
if (writeErrors.length > 0) {
  writeErrors.slice(0, 5).forEach(e => console.log(`  ⚠️  ${e}`));
}
console.log('\n✅ Items are in Supabase with status=pending');
console.log('   Go to /admin → Items tab to review and approve them.\n');
