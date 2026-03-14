#!/usr/bin/env node
// scripts/dry-run-crawl.mjs
// Runs crawler + extractor locally WITHOUT needing Supabase tables.
// Shows full diagnostic report: pages, blocked paths, extraction rates, field population, sample items.
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local (not needed for dry run but keeps imports happy)
try {
  const lines = readFileSync(resolve(__dirname, '../.env.local'), 'utf8').split('\n');
  for (const line of lines) {
    const [k, ...rest] = line.split('=');
    if (k && !k.startsWith('#') && rest.length) process.env[k.trim()] = rest.join('=').trim();
  }
} catch {}

const { crawlSource } = await import('../lib/crawler.js');
const { extractPage } = await import('../lib/extractor.js');
const SOURCES = JSON.parse(readFileSync(resolve(__dirname, '../lib/trusted-sources.json'), 'utf8'));
const source = SOURCES.find(s => s.active);

if (!source) { console.error('No active sources'); process.exit(1); }

console.log('\n══════════════════════════════════════════');
console.log(' DRY-RUN CRAWL — Tampa Downtown Partnership');
console.log('══════════════════════════════════════════\n');
console.log(`Source:      ${source.sourceName}`);
console.log(`URL:         ${source.mainUrl}`);
console.log(`Domain:      ${source.domain}`);
console.log(`Max depth:   ${source.allowedDepth}`);
console.log(`Blocked:     ${(source.blockedPaths||[]).join(', ') || '(none)'}`);
console.log(`Subsources:  ${(source.subsources||[]).map(s => s.subcategory||s.category).join(', ')}\n`);

console.log('Crawling... (this may take 30-60 seconds)\n');
const { pages, diagnostics } = await crawlSource(source);

console.log('══ CRAWL DIAGNOSTICS ══════════════════════════════');
console.log(`Pages visited:       ${diagnostics.pagesVisited}`);
console.log(`Pages skipped:       ${diagnostics.pagesSkipped}`);
console.log(`Total links found:   ${diagnostics.totalLinksFound}`);
console.log(`Fetch errors:        ${diagnostics.fetchErrors.length}`);
console.log(`Blocked paths hit:   ${diagnostics.blockedPathsHit.length}`);
console.log(`Duration:            ${diagnostics.durationMs}ms`);
console.log(`Started at:          ${diagnostics.startedAt}`);

if (diagnostics.blockedPathsHit.length > 0) {
  console.log('\n── Blocked paths (respected) ───────────────────────');
  for (const b of diagnostics.blockedPathsHit.slice(0, 10)) {
    console.log(`  [${b.reason}] ${b.url}`);
  }
  if (diagnostics.blockedPathsHit.length > 10)
    console.log(`  ... and ${diagnostics.blockedPathsHit.length - 10} more`);
}

if (diagnostics.fetchErrors.length > 0) {
  console.log('\n── Fetch errors ───────────────────────────────────');
  for (const e of diagnostics.fetchErrors.slice(0, 5)) console.log(`  ${e}`);
}

// ── Extraction ──────────────────────────────────────────────────────────────
console.log('\n══ EXTRACTION RESULTS ═════════════════════════════');
let extracted = 0, skippedTitle = 0, skippedCat = 0;
const allItems = [];
const fieldReport = {};

for (const { url, html, subsource } of pages) {
  try {
    const item = extractPage(html, url, source, subsource);
    if (!item.title || item.title.length < 3) { skippedTitle++; continue; }
    if (!item.category) { skippedCat++; continue; }
    extracted++;
    allItems.push(item);

    for (const [k, v] of Object.entries(item)) {
      if (!fieldReport[k]) fieldReport[k] = { populated: 0, missing: 0 };
      const has = v && (Array.isArray(v) ? v.length > 0 : true);
      if (has) fieldReport[k].populated++;
      else fieldReport[k].missing++;
    }
  } catch (err) {
    console.log(`  ⚠ Extract error: ${url} — ${err.message}`);
  }
}

console.log(`\nExtracted:           ${extracted} / ${pages.length} pages`);
console.log(`Skipped (no title):  ${skippedTitle}`);
console.log(`Skipped (no cat):    ${skippedCat}`);
console.log(`Success rate:        ${pages.length > 0 ? Math.round((extracted / pages.length) * 100) : 0}%`);

console.log('\n── Field population rates ──────────────────────────');
for (const [field, counts] of Object.entries(fieldReport)) {
  const total = counts.populated + counts.missing;
  const pct = Math.round((counts.populated / total) * 100);
  const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
  console.log(`  ${field.padEnd(16)} ${bar} ${pct}% (${counts.populated}/${total})`);
}

// ── Duplicate detection ──────────────────────────────────────────────────────
const urls = allItems.map(i => i.url);
const uniqueUrls = new Set(urls);
const dupes = urls.length - uniqueUrls.size;
console.log(`\n── Duplicate detection ─────────────────────────────`);
console.log(`  Unique URLs:       ${uniqueUrls.size}`);
console.log(`  Duplicate URLs:    ${dupes}`);

// ── Sample extracted items ───────────────────────────────────────────────────
console.log('\n══ SAMPLE EXTRACTED ITEMS ═════════════════════════');
for (let i = 0; i < Math.min(allItems.length, 5); i++) {
  const item = allItems[i];
  console.log(`\n  [${i + 1}] ${item.title}`);
  console.log(`      URL:         ${item.url}`);
  console.log(`      Category:    ${item.category}${item.subcategory ? ' › ' + item.subcategory : ''}`);
  console.log(`      Price:       ${item.price || '—'}`);
  console.log(`      Date:        ${item.event_date || '—'}`);
  console.log(`      Area:        ${item.area || '—'}`);
  console.log(`      Audience:    ${(item.audience || []).join(', ') || '—'}`);
  console.log(`      Summary:     ${(item.summary || '—').slice(0, 120)}`);
  console.log(`      Source:      ${item.source_name} (${item.source_domain})`);
}

// ── All URLs visited ────────────────────────────────────────────────────────
console.log('\n══ ALL PAGES VISITED ══════════════════════════════');
for (const { url } of pages) console.log(`  ${url}`);

console.log('\n══════════════════════════════════════════');
console.log(' DRY RUN COMPLETE — no database writes');
console.log('══════════════════════════════════════════\n');
