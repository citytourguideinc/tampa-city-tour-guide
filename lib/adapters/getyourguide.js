// lib/adapters/getyourguide.js
// GetYourGuide Partner API adapter
// Docs: https://api.getyourguide.com/docs
// Requires: GETYOURGUIDE_API_KEY env var (apply at partner.getyourguide.com)
// GETYOURGUIDE_PARTNER_ID is already set — used for affiliate link appending

const GYG_BASE = 'https://api.getyourguide.com/1';
const PARTNER_ID = process.env.GETYOURGUIDE_PARTNER_ID || '';
const API_KEY    = process.env.GETYOURGUIDE_API_KEY || '';

/**
 * Search GetYourGuide activities for a given query + city
 * @param {string} query — search term e.g. "boat tours"
 * @param {string} city  — city name e.g. "Tampa"
 * @returns {Array} normalized activity objects
 */
export async function searchGYG(query = '', city = 'Tampa') {
  if (!API_KEY) return []; // gracefully skip if key not set

  try {
    const params = new URLSearchParams({
      q: `${query} ${city}`.trim(),
      lang: 'en',
      currency: 'USD',
      limit: '20',
    });
    const res = await fetch(`${GYG_BASE}/activities?${params}`, {
      headers: {
        'X-ACCESS-TOKEN': API_KEY,
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 }, // Next.js cache 1hr
    });
    if (!res.ok) {
      console.warn(`GYG API error ${res.status}:`, await res.text());
      return [];
    }
    const data = await res.json();
    return (data.data?.activities || []).map(normalizeGYG);
  } catch (err) {
    console.warn('GYG API fetch failed:', err.message);
    return [];
  }
}

/** Normalize a GYG activity object to our unified schema */
function normalizeGYG(a) {
  const baseUrl = a.url || `https://www.getyourguide.com/-t${a.tour_id}/`;
  const affiliateUrl = PARTNER_ID
    ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}partner_id=${PARTNER_ID}`
    : baseUrl;

  return {
    id:             `gyg_${a.tour_id}`,
    activity_name:  a.title,
    category:       'Tours & Activities',
    city,
    neighborhood:   city,
    short_summary:  a.abstract || a.description?.slice(0, 180) || '',
    source_type:    'affiliate',
    source_name:    'GetYourGuide',
    booking_link:   affiliateUrl,
    official_link:  null,
    icon:           '🎟',
    price_min:      a.price?.value ? Math.floor(a.price.value) : null,
    price_max:      null,
    featured_status: false,
    active_status:  true,
    lat:            a.locations?.[0]?.coordinates?.latitude  || null,
    lng:            a.locations?.[0]?.coordinates?.longitude || null,
    image_url:      a.pictures?.[0]?.url || null,
    rating:         a.rating?.overall || null,
    review_count:   a.number_of_ratings || null,
  };
}

const city = 'Tampa'; // default city context
