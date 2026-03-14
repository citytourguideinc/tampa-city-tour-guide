// app/api/search/route.js — Trusted-items-only search with deduplication
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Strip ?occurrence= and ?time= from recurring event URLs to get canonical base URL
function baseUrl(u) {
  try {
    const url = new URL(u);
    url.searchParams.delete('occurrence');
    url.searchParams.delete('time');
    return url.search === '?' ? url.origin + url.pathname : url.href;
  } catch { return u; }
}

export async function GET(request) {
  if (!supabase) {
    return NextResponse.json({ results: [], hint: 'Supabase not configured.' });
  }

  const { searchParams } = new URL(request.url);
  const q        = searchParams.get('q')?.trim();
  const category = searchParams.get('category');
  const area     = searchParams.get('area');
  const date     = searchParams.get('date');   // ISO date | 'today' | 'weekend'
  const price    = searchParams.get('price');  // 'free'
  const limit    = parseInt(searchParams.get('limit') || '200', 10); // fetch more, dedupe later

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDate = new Date(todayStr);

  try {
    let query = supabase
      .from('trusted_items')
      .select('id,title,url,source_name,source_domain,category,subcategory,area,price,event_date,summary,listing_type,is_monetized,status')
      .eq('status', 'approved')
      .limit(limit);

    // Full-text search
    if (q) query = query.textSearch('fts', q, { type: 'websearch', config: 'english' });

    // Filters
    if (category) query = query.eq('category', category);
    if (area)     query = query.ilike('area', `%${area}%`);
    if (price === 'free') query = query.ilike('price', '%free%');

    // Date filters — applied BEFORE dedup so we fetch the right occurrences
    if (date === 'today') {
      query = query.eq('event_date', todayStr);
    } else if (date === 'weekend') {
      const d = new Date();
      const sat = new Date(d);
      sat.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
      const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
      query = query
        .gte('event_date', sat.toISOString().slice(0, 10))
        .lte('event_date', sun.toISOString().slice(0, 10));
    } else if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      query = query.eq('event_date', date);
    }

    query = query
      .order('listing_type', { ascending: false })
      .order('event_date',   { ascending: true, nullsFirst: false })
      .order('title',        { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    // ── Deduplicate recurring events ──────────────────────────────
    // Same event with different ?occurrence= dates → keep ONE (best date match)
    const byBase = {};
    for (const item of (data || [])) {
      const key = baseUrl(item.url);
      if (!byBase[key]) { byBase[key] = item; continue; }

      const existing = byBase[key];
      // Exact date filter match wins
      if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        if (item.event_date === date) { byBase[key] = item; continue; }
        if (existing.event_date === date) continue;
      }
      // Prefer nearest upcoming, then most recent past
      const iDate = item.event_date     ? new Date(item.event_date)     : null;
      const eDate = existing.event_date ? new Date(existing.event_date) : null;
      if (!eDate && iDate) { byBase[key] = item; continue; }
      if (!iDate) continue;
      const iUp = iDate >= todayDate;
      const eUp = eDate >= todayDate;
      if (iUp && !eUp)  { byBase[key] = item; continue; }
      if (!iUp && eUp)  continue;
      if (iUp  ? iDate < eDate : iDate > eDate) byBase[key] = item;
    }

    // Normalise shape
    const results = Object.values(byBase).map(item => ({
      ...item,
      description:    item.summary,
      destinationUrl: item.url,
      listingType:    item.listing_type || 'standard',
      isMonetized:    item.is_monetized || false,
      isFeatured:     item.listing_type === 'featured',
      isPartner:      item.listing_type === 'partner',
    }));

    return NextResponse.json({
      results,
      count: results.length,
      source: 'trusted_items',
    });
  } catch (err) {
    console.error('Search error:', err.message);
    return NextResponse.json({ results: [], error: err.message }, { status: 500 });
  }
}
