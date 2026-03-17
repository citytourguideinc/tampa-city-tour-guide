// app/api/viator-featured/route.js
// Returns top Viator products for Tampa — cached for 1 hour
// Uses production partner API key + affiliate ID for monetized links

const VIATOR_BASE   = 'https://api.viator.com/partner';
const API_KEY       = process.env.VIATOR_API_KEY;
const PARTNER_ID    = process.env.VIATOR_PARTNER_ID || 'P00292624';
const TAMPA_DEST_ID = '5765'; // Viator destination ID for Tampa

let cache = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET() {
  // Serve from cache if fresh
  if (cache && Date.now() - cacheTime < CACHE_TTL) {
    return Response.json({ products: cache });
  }

  if (!API_KEY) {
    return Response.json({ products: getFallback() });
  }

  try {
    const res = await fetch(`${VIATOR_BASE}/products/search`, {
      method: 'POST',
      headers: {
        'exp-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json;version=2.0',
      },
      body: JSON.stringify({
        filtering: {
          destination: TAMPA_DEST_ID,
          lowestPrice: 0,
          highestPrice: 999,
        },
        sorting: { sort: 'TOP_RATED', order: 'DESCENDING' },
        pagination: { start: 1, count: 12 },
        currency: 'USD',
      }),
    });

    if (!res.ok) {
      console.warn('Viator API error:', res.status, await res.text());
      return Response.json({ products: getFallback() });
    }

    const data = await res.json();
    const products = (data.products || []).map(p => normalize(p));

    cache = products;
    cacheTime = Date.now();

    return Response.json({ products });
  } catch (err) {
    console.warn('Viator fetch failed:', err.message);
    return Response.json({ products: getFallback() });
  }
}

function normalize(p) {
  const baseUrl = p.productUrl || `https://www.viator.com/tours/${p.productCode}`;
  const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}pid=${PARTNER_ID}&mcid=42383&medium=link`;
  const image = p.images?.[0]?.variants?.find(v => v.width >= 200)?.url
             || p.images?.[0]?.variants?.[0]?.url
             || null;
  const price = p.pricing?.summary?.fromPrice;

  return {
    code:    p.productCode,
    title:   p.title,
    url,
    image,
    price:   price ? `From $${Math.floor(price)}` : null,
    rating:  p.reviews?.combinedAverageRating?.toFixed(1) || null,
    reviews: p.reviews?.totalReviews || null,
  };
}

// Fallback static links if API unavailable
function getFallback() {
  const base = `pid=${PARTNER_ID}&mcid=42383&medium=link`;
  return [
    { code: 'f1', title: 'Sunset Cruise',   emoji: '🚤', url: `https://www.viator.com/Tampa-Bay/d663-g15953/tours-cruises?${base}` },
    { code: 'f2', title: 'Zoo & Wildlife',  emoji: '🐊', url: `https://www.viator.com/Tampa/d663-g3/tours-nature?${base}` },
    { code: 'f3', title: 'City Tours',      emoji: '🏙', url: `https://www.viator.com/Tampa/d663-g9/tours-city?${base}` },
    { code: 'f4', title: 'Events & Shows',  emoji: '🎭', url: `https://www.viator.com/Tampa/d663-g12/tours-shows?${base}` },
    { code: 'f5', title: 'Water Sports',    emoji: '🛶', url: `https://www.viator.com/Tampa/d663-g5/tours-water?${base}` },
    { code: 'f6', title: 'Food Tours',      emoji: '🍽', url: `https://www.viator.com/Tampa/d663-g4/tours-food?${base}` },
  ];
}
