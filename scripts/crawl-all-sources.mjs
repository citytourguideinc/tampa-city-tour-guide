#!/usr/bin/env node
// scripts/crawl-all-sources.mjs
// Crawls ALL trusted sources locally and saves to Supabase directly.
// Bypasses Vercel serverless timeout. Run: node scripts/crawl-all-sources.mjs
// To skip a source: node scripts/crawl-all-sources.mjs --skip "Tampa Downtown Partnership"
// To run one source: node scripts/crawl-all-sources.mjs --only "Visit Tampa Bay"

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ─────────────────────────────────────────────────────────
try {
  const lines = readFileSync(resolve(__dirname, '../.env.local'), 'utf8').split('\n');
  for (const line of lines) {
    const eq = line.indexOf('=');
    if (eq < 1 || line.startsWith('#')) continue;
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim();
    if (k && !process.env[k]) process.env[k] = v;
  }
} catch { console.warn('Could not load .env.local'); }

// ── Parse CLI args ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const skipIdx = args.indexOf('--skip');
const onlyIdx = args.indexOf('--only');
const skipName = skipIdx !== -1 ? args[skipIdx + 1] : null;
const onlyName = onlyIdx !== -1 ? args[onlyIdx + 1] : null;
const dryRun   = args.includes('--dry-run');

// ── Supabase ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Load modules ─────────────────────────────────────────────────────────────
const { crawlSource } = await import('../lib/crawler.js');
const { extractPage } = await import('../lib/extractor.js');
const SOURCES = JSON.parse(readFileSync(resolve(__dirname, '../lib/trusted-sources.json'), 'utf8'));

// ── Filter sources ───────────────────────────────────────────────────────────
let sources = SOURCES.filter(s => s.active);
if (onlyName) sources = sources.filter(s => s.sourceName.toLowerCase().includes(onlyName.toLowerCase()));
if (skipName) sources = sources.filter(s => !s.sourceName.toLowerCase().includes(skipName.toLowerCase()));

console.log(`\n${'═'.repeat(60)}`);
console.log(` City Tour Guide — Local Crawl`);
console.log(` Sources: ${sources.map(s => s.sourceName).join(', ')}`);
console.log(` Dry run: ${dryRun}`);
console.log(`${'═'.repeat(60)}\n`);

// ── Junk filters (mirrors search API) ────────────────────────────────────────
const JUNK_TITLE = [/\barchives?\b/i, /^all\s+\w/i, /\bpage\s+\d+/i, /^(events|news|newsletter|monday morning memo|insider|memo)$/i];
const JUNK_URL   = [/\/page\/\d+\//, /\?paged=\d+/, /\/wp-json\//, /\/feed\//];
function isJunk(t, u) { return JUNK_TITLE.some(p => p.test(t)) || JUNK_URL.some(p => p.test(u)); }

// ── Totals ───────────────────────────────────────────────────────────────────
let totalNew = 0, totalSkipped = 0, totalErrors = 0;

// Helper: resolve a promise or reject after ms milliseconds
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`⏰ ${label} timed out after ${ms/1000}s`)), ms)
    ),
  ]);
}

for (const source of sources) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(` Crawling: ${source.sourceName} (${source.domain})`);
  console.log(`${'─'.repeat(60)}`);

  // Ensure source row exists in trusted_sources
  let sourceId = null;
  if (!dryRun) {
    try {
      const { data: existing } = await sb.from('trusted_sources')
        .select('id').eq('domain', source.domain).maybeSingle();
      if (existing) {
        sourceId = existing.id;
      } else {
        const { data: inserted, error: ie } = await sb.from('trusted_sources').insert({
          source_name:    source.sourceName,
          main_url:       source.mainUrl,
          domain:         source.domain,
          source_type:    source.sourceType || 'official',
          allowed_depth:  source.allowedDepth,
          blocked_paths:  source.blockedPaths || [],
          active:         true,
          city:           source.city || 'Tampa',
        }).select('id').single();
        if (ie) console.warn('  ⚠ Could not insert source row:', ie.message);
        else sourceId = inserted?.id;
      }
    } catch (dbErr) {
      console.warn(`  ⚠ DB error: ${dbErr.message}`);
    }
  }

  // Crawl — 3 minutes max per source so one blocked/slow site can't stall the job
  let pages, diagnostics;
  try {
    ({ pages, diagnostics } = await withTimeout(
      crawlSource(source), 3 * 60 * 1000, source.sourceName
    ));
  } catch (err) {
    console.error(`  ❌ Crawl failed: ${err.message}`);
    totalErrors++;
    continue;
  }

  console.log(`  Pages visited: ${diagnostics.pagesVisited} | Skipped: ${diagnostics.pagesSkipped} | Errors: ${diagnostics.fetchErrors.length}`);
  if (diagnostics.robotsBlocked) { console.log(`  🚫 robots.txt blocked this source`); continue; }

  // Extract + save
  let sourceNew = 0, sourceDup = 0, sourceSkipped = 0;

  for (const { url, html, subsource } of pages) {
    let item;
    try {
      item = extractPage(html, url, source, subsource);
    } catch (err) {
      console.warn(`  ⚠ Extract error [${url}]: ${err.message}`);
      totalErrors++;
      continue;
    }

    if (!item.title || item.title.length < 3) { sourceSkipped++; continue; }
    if (!item.category)                        { sourceSkipped++; continue; }
    if (isJunk(item.title, item.url))          { sourceSkipped++; continue; }

    if (dryRun) {
      console.log(`  [DRY] ${item.category} | ${item.title.slice(0, 60)} | ${item.event_date || 'no date'}`);
      sourceNew++;
      continue;
    }

    // Check for duplicate URL
    const { data: dup } = await sb.from('trusted_items')
      .select('id').eq('url', item.url).maybeSingle();
    if (dup) { sourceDup++; continue; }

    const { error: ie } = await sb.from('trusted_items').insert({
      title:          item.title,
      url:            item.url,
      source_name:    item.source_name,
      source_domain:  item.source_domain,
      source_id:      sourceId,
      category:       item.category,
      subcategory:    item.subcategory || null,
      area:           item.area || source.area || null,
      price:          item.price || null,
      event_date:     item.event_date || null,
      summary:        item.summary || null,
      status:         'approved',
      listing_type:   'standard',
    });

    if (ie) {
      console.warn(`  ⚠ Insert error: ${ie.message} [${item.url.slice(0, 60)}]`);
      totalErrors++;
    } else {
      sourceNew++;
    }
  }

  console.log(`  ✅ ${source.sourceName}: +${sourceNew} new | ${sourceDup} dupes skipped | ${sourceSkipped} filtered`);
  totalNew      += sourceNew;
  totalSkipped  += sourceDup + sourceSkipped;
}

console.log(`\n${'═'.repeat(60)}`);
console.log(` DONE — Total new: ${totalNew} | Skipped: ${totalSkipped} | Errors: ${totalErrors}`);
console.log(`${'═'.repeat(60)}\n`);
