// scripts/cleanup-items.js
// Run with: node scripts/cleanup-items.js
// Fixes stale/bad data in trusted_items table:
//   1. Re-categorises Neighborhood pages from Tours & Activities → Discovery
//   2. Hides junk items (very short titles, generic menu text)
//   3. Hides category listing pages (e.g. "Find a Tour in Tampa Bay")

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Junk title patterns ───────────────────────────────────────────────────────
const JUNK_TITLES = [
  /^(dine|drink|food|events?|news|newsletter|shop|restaurants?|things to do|tours?|activities|hotels?|parking|map|home|about|contact|filter|more|all)$/i,
  /^page\s+\d+/i,
  /^archives?/i,
  /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+morning/i,
  /^insider\s+tips?$/i,
];

// ── Category listing page patterns (URL looks like a section index) ───────────
const JUNK_URL_PATTERNS = [
  /\/(tours?|events?|restaurants?|things-to-do|find-a-tour|attractions?)\/?$/i,
  /\/page\/\d+\//,
  /\?paged=\d+/,
];

function isJunkTitle(title) {
  if (!title) return true;
  if (title.length < 5) return true; // too short
  return JUNK_TITLES.some(rx => rx.test(title.trim()));
}

function isJunkUrl(url) {
  if (!url) return false;
  return JUNK_URL_PATTERNS.some(rx => rx.test(url));
}

async function run() {
  console.log('🔍 Fetching all items...');
  const { data: items, error } = await supabase
    .from('trusted_items')
    .select('id, title, url, category, subcategory, status')
    .neq('status', 'hidden'); // don't re-process already hidden items

  if (error) { console.error('Fetch error:', error.message); process.exit(1); }
  console.log(`Found ${items.length} non-hidden items to audit.\n`);

  let reCategorised = 0, hiddenJunk = 0, hiddenListingPage = 0;

  for (const item of items) {
    // 1. Fix Neighborhoods category
    if (item.subcategory === 'Neighborhoods' && item.category !== 'Discovery') {
      const { error: e } = await supabase
        .from('trusted_items')
        .update({ category: 'Discovery' })
        .eq('id', item.id);
      if (!e) { reCategorised++; console.log(`  ✅ Re-categorised: "${item.title}"`); }
    }

    // 2. Hide junk titles
    else if (isJunkTitle(item.title)) {
      const { error: e } = await supabase
        .from('trusted_items')
        .update({ status: 'hidden' })
        .eq('id', item.id);
      if (!e) { hiddenJunk++; console.log(`  🗑️  Hidden (junk title): "${item.title}"`); }
    }

    // 3. Hide category listing pages
    else if (isJunkUrl(item.url)) {
      const { error: e } = await supabase
        .from('trusted_items')
        .update({ status: 'hidden' })
        .eq('id', item.id);
      if (!e) { hiddenListingPage++; console.log(`  🗑️  Hidden (listing page): "${item.title}" — ${item.url}`); }
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`   Re-categorised to Discovery: ${reCategorised}`);
  console.log(`   Hidden (junk titles):        ${hiddenJunk}`);
  console.log(`   Hidden (listing pages):      ${hiddenListingPage}`);
}

run();
