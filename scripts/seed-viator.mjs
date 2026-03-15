// scripts/seed-viator.mjs
// Fetches Tampa tours from Viator API and seeds them into trusted_items
// Run locally: node scripts/seed-viator.mjs
// Or include in daily crawl via the /api/crawl route
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VIATOR_KEY   = process.env.VIATOR_API_KEY || 'a4fea399-01ac-4700-b0b6-5d650efb4e34';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const VIATOR_BASE = 'https://api.viator.com/partner';
const HEADERS = {
  'exp-api-key': VIATOR_KEY,
  'Accept': 'application/json;version=2.0',
  'Accept-Language': 'en-US',
  'Content-Type': 'application/json',
};

// Tampa destination IDs — try in order until one works
const TAMPA_DEST_ID = '732'; // Viator dest code for Tampa, FL

async function fetchTampaTours(query = '', count = 50) {
  const body = {
    filtering: {
      destination: TAMPA_DEST_ID,
    },
    sorting: { sort: 'TRAVELER_RATING', order: 'DESCENDING' },
    pagination: { start: 1, count },
    currency: 'USD',
  };

  const res = await fetch(`${VIATOR_BASE}/products/search`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Viator API ${res.status}: ${text}`);
  }

  return res.json();
}

function toItem(p) {
  const price = p.pricing?.summary?.fromPrice;
  const rating = p.reviews?.combinedAverageRating;
  const reviewCount = p.reviews?.totalReviews;
  const duration = p.duration?.fixedDurationInMinutes;

  // Build affiliate URL with partner tracking
  const url = `https://www.viator.com/tours/${p.productCode}?pid=P00292624&mcid=42383&medium=api&api=1`;

  const metaParts = [];
  if (price)  metaParts.push(`From $${price}`);
  if (rating) metaParts.push(`⭐ ${rating.toFixed(1)} (${(reviewCount || 0).toLocaleString()} reviews)`);
  if (duration) {
    const hrs = Math.floor(duration / 60);
    const mins = duration % 60;
    metaParts.push(hrs > 0 ? `${hrs}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`);
  }

  const summary = [p.description?.substring(0, 200), metaParts.join(' · ')]
    .filter(Boolean).join(' — ');

  return {
    title:        p.title,
    summary,
    url,
    source_name:  'Viator',
    source_domain:'viator.com',
    category:     'Tours & Activities',
    area:         'Tampa',
    price:        price ? `From $${price}` : null,
    listing_type: 'standard',
    status:       'approved',
    city:         'Tampa',
  };
}

async function main() {
  console.log('Fetching Tampa tours from Viator API…');

  let data;
  try {
    data = await fetchTampaTours('', 50);
  } catch (e) {
    console.error('❌ Viator API error:', e.message);
    console.log('Note: Sandbox key takes up to 24h to activate. Try again later.');
    process.exit(1);
  }

  const products = data.products || [];
  console.log(`✅ Got ${products.length} tours from Viator`);

  if (products.length === 0) {
    console.log('No products returned — check API key activation or destination ID.');
    process.exit(0);
  }

  const items = products.map(toItem);

  // Upsert into trusted_items (match on viator_product_code if column exists, else on url)
  const { data: upserted, error } = await supabase
    .from('trusted_items')
    .upsert(items, {
      onConflict: 'url',
      ignoreDuplicates: false,
    })
    .select('id');

  if (error) {
    console.error('❌ Supabase upsert error:', error.message);
    process.exit(1);
  }

  console.log(`✅ Upserted ${upserted?.length || items.length} Viator tours into trusted_items`);
  console.log('Categories: Tours & Activities | Source: Viator | Status: approved');
}

main().catch(e => { console.error(e); process.exit(1); });
