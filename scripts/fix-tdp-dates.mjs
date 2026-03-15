#!/usr/bin/env node
// scripts/fix-tdp-dates.mjs
// Re-fetches all Tampa Downtown Partnership event pages and corrects event_date
// while keeping status=approved. Uses the updated extractor.

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
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

const { extractPage } = await import('../lib/extractor.js');

console.log('Fetching Tampa Downtown Partnership event records from Supabase...');

// Get all TDP event pages with URLs
const res = await fetch(
  `${SUPABASE_URL}/rest/v1/trusted_items?source_domain=eq.tampasdowntown.com&event_date=not.is.null&select=id,title,url,event_date`,
  { headers: HEADERS }
);
const items = await res.json();
console.log(`Found ${items.length} TDP items with event dates\n`);

let updated = 0, unchanged = 0, failed = 0;

for (const item of items) {
  try {
    // Fetch the live event page
    const pageRes = await fetch(item.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TampaCityTourGuide/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!pageRes.ok) { failed++; console.log(`  ⚠️  ${pageRes.status} — ${item.url}`); continue; }

    const html = await pageRes.text();
    const extracted = extractPage(html, item.url, { sourceName: 'Tampa Downtown Partnership', domain: 'tampasdowntown.com', sourceType: 'events', city: 'Tampa' });

    const newDate = extracted.event_date;

    if (!newDate || newDate === item.event_date) {
      unchanged++;
      continue;
    }

    // Patch only the event_date — keep status=approved
    const patch = await fetch(
      `${SUPABASE_URL}/rest/v1/trusted_items?id=eq.${item.id}`,
      { method: 'PATCH', headers: HEADERS, body: JSON.stringify({ event_date: newDate }) }
    );

    if (patch.ok) {
      updated++;
      console.log(`  ✅ "${item.title}"\n     ${item.event_date} → ${newDate}`);
    } else {
      failed++;
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 300));
  } catch (e) {
    failed++;
    console.log(`  ❌ Error for ${item.url}: ${e.message}`);
  }
}

console.log(`\n══ Done ══`);
console.log(`Updated:   ${updated}`);
console.log(`Unchanged: ${unchanged}`);
console.log(`Failed:    ${failed}`);
