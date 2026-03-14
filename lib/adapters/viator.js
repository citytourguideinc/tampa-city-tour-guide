// lib/adapters/viator.js
// Viator Partner API adapter
// Docs: https://partnerresources.viator.com/docs
// Requires: VIATOR_API_KEY env var (apply at partnerresources.viator.com)
// VIATOR_AFFILIATE_ID is already set — used for affiliate link appending

const VIATOR_BASE = 'https://api.viator.com/partner';
const AFFILIATE_ID = process.env.VIATOR_AFFILIATE_ID || '';
const API_KEY      = process.env.VIATOR_API_KEY || '';

// Tampa destination ID on Viator
const TAMPA_DEST_ID = 5765;

/**
 * Search Viator products for a given query + city
 * @param {string} query
 * @param {string} city
 * @returns {Array} normalized activity objects
 */
export async function searchViator(query = '', city = 'Tampa') {
  if (!API_KEY) return []; // gracefully skip if key not set

  try {
    const body = {
      filtering: {
        destination: String(TAMPA_DEST_ID),
        tags: [],
        lowestPrice: 0,
        highestPrice: 999,
        textSearch: query || undefined,
      },
      sorting: { sort: 'RELEVANCE', order: 'DESCENDING' },
      pagination: { start: 1, count: 20 },
      currency: 'USD',
    };

    const res = await fetch(`${VIATOR_BASE}/products/search`, {
      method: 'POST',
      headers: {
        'exp-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json;version=2.0',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn(`Viator API error ${res.status}:`, await res.text());
      return [];
    }
    const data = await res.json();
    return (data.products || []).map(p => normalizeViator(p, city));
  } catch (err) {
    console.warn('Viator API fetch failed:', err.message);
    return [];
  }
}

/** Normalize a Viator product to unified schema */
function normalizeViator(p, city = 'Tampa') {
  const baseUrl  = p.productUrl || `https://www.viator.com/tours/${p.productCode}`;
  const affiliateUrl = AFFILIATE_ID
    ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}mcid=${AFFILIATE_ID}`
    : baseUrl;

  const price = p.pricing?.summary?.fromPrice;

  return {
    id:             `viator_${p.productCode}`,
    activity_name:  p.title,
    category:       p.tags?.[0]?.allNamesByLocale?.en || 'Tours & Activities',
    city,
    neighborhood:   city,
    short_summary:  p.description?.slice(0, 180) || '',
    source_type:    'affiliate',
    source_name:    'Viator',
    booking_link:   affiliateUrl,
    official_link:  null,
    icon:           '🎫',
    price_min:      price ? Math.floor(price) : null,
    price_max:      null,
    featured_status: false,
    active_status:  true,
    lat:            p.itinerary?.pointsOfInterest?.[0]?.coordinates?.lat || null,
    lng:            p.itinerary?.pointsOfInterest?.[0]?.coordinates?.lng || null,
    image_url:      p.images?.[0]?.variants?.[0]?.url || null,
    rating:         p.reviews?.combinedAverageRating || null,
    review_count:   p.reviews?.totalReviews || null,
  };
}
