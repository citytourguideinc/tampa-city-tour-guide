#!/usr/bin/env node
// scripts/fix-source-dates.mjs
// Re-fetches event pages for ANY source and corrects event_date in Supabase
// while keeping status=approved untouched.
//
// Usage:
//   node scripts/fix-source-dates.mjs --domain=tampasdowntown.com
//   node scripts/fix-source-dates.mjs --domain=visittampabay.com
//   node scripts/fix-source-dates.mjs --all   (all sources with event dates)

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ──────────────────────────────────────────────────────────
const envPath = resolve(__dirname, '../.env.local');
const lines = readFileSync(envPath, 'utf8').split('\n');
for (const line of lines) {
  const [k, ...rest] = line.split('=');
  if (k && !k.startsWith('#') && rest.length) process.env[k.trim()] = rest.join('=').trim();
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const HEADERS = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

// ── Parse args ──────────────────────────────────────────────────────────────
const args   = process.argv.slice(2);
const domain = args.find(a => a.startsWith('--domain='))?.split('=')[1];
const all    = args.includes('--all');

if (!domain && !all) {
  console.error('Usage: node scripts/fix-source-dates.mjs --domain=example.com');
  console.error('       node scripts/fix-source-dates.mjs --all');
  process.exit(1);
}

// ── Load extractor ───────────────────────────────────────────────────────────
const { extractPage } = await import('../lib/extractor.js');
const SOURCES = JSON.parse(readFileSync(resolve(__dirname, '../lib/trusted-sources.json'), 'utf8'));

// ── Fetch items from Supabase ────────────────────────────────────────────────
let url = `${SUPABASE_URL}/rest/v1/trusted_items?event_date=not.is.null&select=id,title,url,event_date,source_domain,source_name`;
if (!all) url += `&source_domain=eq.${domain}`;

const res   = await fetch(url, { headers: HEADERS });
const items = await res.json();
console.log(`\nfixing dates for: ${all ? 'ALL sources' : domain}`);
console.log(`Found ${items.length} items with event dates\n`);

let updated = 0, unchanged = 0, failed = 0;

for (const item of items) {
  // Find matching source config for correct metadata
  const src = SOURCES.find(s => s.domain === item.source_domain) || {
    sourceName: item.source_name, domain: item.source_domain,
    sourceType: 'events', city: 'Tampa',
  };

  try {
    const pageRes = await fetch(item.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TampaCityTourGuide/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!pageRes.ok) { failed++; process.stdout.write(`⚠️  ${pageRes.status} ${item.url}\n`); continue; }

    const html = await pageRes.text();
    const extracted = extractPage(html, item.url, src);
    const newDate   = extracted.event_date;

    if (!newDate || newDate === item.event_date) { unchanged++; continue; }

    // PATCH only event_date — keep status, title, everything else
    const patch = await fetch(
      `${SUPABASE_URL}/rest/v1/trusted_items?id=eq.${item.id}`,
      { method: 'PATCH', headers: HEADERS, body: JSON.stringify({ event_date: newDate }) }
    );

    if (patch.ok) {
      updated++;
      console.log(`  ✅ "${item.title}"\n     ${item.event_date} → ${newDate}`);
    } else { failed++; }

    await new Promise(r => setTimeout(r, 250)); // polite delay
  } catch (e) {
    failed++;
    process.stdout.write(`  ❌ ${e.message} — ${item.url}\n`);
  }
}

console.log('\n══ Done ══');
console.log(`Updated:   ${updated}`);
console.log(`Unchanged: ${unchanged}`);
console.log(`Failed:    ${failed}`);
