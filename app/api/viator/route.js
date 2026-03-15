// app/api/viator/route.js — Server-side Viator API proxy
// Uses production key: a4fea399-01ac-4700-b0b6-5d650efb4e34
import { NextResponse } from 'next/server';

const VIATOR_BASE = 'https://api.viator.com/partner';
const API_KEY = process.env.VIATOR_API_KEY || 'a4fea399-01ac-4700-b0b6-5d650efb4e34';

const HEADERS = {
  'exp-api-key': API_KEY,
  'Accept': 'application/json;version=2.0',
  'Accept-Language': 'en-US',
  'Content-Type': 'application/json',
};

// Tampa, FL destination IDs to try
const TAMPA_DEST_IDS = ['732', '24091', '4079'];

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || 'Tampa';
  const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 12);

  // Try products search with Tampa destination
  const body = {
    filtering: {
      destination: '732', // Tampa, FL
      ...(q && q !== 'Tampa' ? { tags: [] } : {}),
    },
    sorting: { sort: 'TRAVELER_RATING', order: 'DESCENDING' },
    pagination: { start: 1, count: limit },
    currency: 'USD',
  };

  try {
    const res = await fetch(`${VIATOR_BASE}/products/search`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(body),
      next: { revalidate: 3600 }, // cache 1 hour
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Viator API error:', res.status, err);
      return NextResponse.json({ error: 'Viator API error', status: res.status, products: [] }, { status: 200 });
    }

    const data = await res.json();
    const products = (data.products || []).map(p => ({
      id: p.productCode,
      title: p.title,
      description: p.description,
      price: p.pricing?.summary?.fromPrice,
      currency: p.pricing?.currency || 'USD',
      rating: p.reviews?.combinedAverageRating,
      reviewCount: p.reviews?.totalReviews,
      image: p.images?.[0]?.variants?.find(v => v.width >= 400)?.url || p.images?.[0]?.variants?.[0]?.url,
      url: `https://www.viator.com/tours/${p.productCode}?pid=P00292624&mcid=42383&medium=api`,
      duration: p.duration?.fixedDurationInMinutes,
      source: 'Viator',
    }));

    return NextResponse.json({ products }, { status: 200 });
  } catch (e) {
    console.error('Viator fetch error:', e);
    return NextResponse.json({ error: e.message, products: [] }, { status: 200 });
  }
}
