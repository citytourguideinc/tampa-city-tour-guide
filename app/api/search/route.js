// app/api/search/route.js — Trusted-items search with DB-level filtering + two-pass dedup
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Strip ?occurrence= and ?time= from recurring event URLs
function baseUrl(u) {
  try {
    const url = new URL(u);
    url.searchParams.delete('occurrence');
    url.searchParams.delete('time');
    return url.search === '?' ? url.origin + url.pathname : url.href;
  } catch { return u; }
}

// Normalize title for secondary dedup (same event, different URL)
function normTitle(t, src) {
  if (!t) return '';
  const srcWord = (src || '').split(' ')[0].toLowerCase();
  return t.toLowerCase()
    .replace(new RegExp(`[-–|·]\\s*${srcWord}.*$`), '')
    .replace(/[-–|·]\s*(tampa|downtown|partnership).*$/i, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 50);
}

// Junk-page patterns — WordPress category/archive/index pages
const JUNK_TITLE_PATTERNS = [
  /\barchives?\b/i,
  /^all\s+\w/i,             // "All Events", "All Listings"
  /\bpage\s+\d+/i,          // "Page 2"
  /^(events|news|newsletter|monday morning memo|insider|memo)$/i,
];
const JUNK_URL_PATTERNS = [
  /\/page\/\d+\//,          // pagination
  /\?paged=\d+/,
  /\/wp-json\//,
  /\/feed\//,
];

function isJunk(item) {
  if (JUNK_TITLE_PATTERNS.some(p => p.test(item.title || ''))) return true;
  if (JUNK_URL_PATTERNS.some(p => p.test(item.url || '')))     return true;
  return false;
}

export async function GET(request) {
  if (!supabase) {
    return NextResponse.json({ results: [], hint: 'Supabase not configured.' });
  }

  const { searchParams } = new URL(request.url);
  const q        = searchParams.get('q')?.trim();
  const category = searchParams.get('category');
  const area     = searchParams.get('area');
  const date     = searchParams.get('date');
  const price    = searchParams.get('price');

  const todayStr  = new Date().toISOString().slice(0, 10);
  const todayDate = new Date(todayStr);

  try {
    // Keep limit reasonable — dedup further in JS
    let query = supabase
      .from('trusted_items')
      .select('id,title,url,source_name,source_domain,category,subcategory,area,price,event_date,summary,listing_type,is_monetized,status')
      .eq('status', 'approved')
      .limit(300);

    if (q)        query = query.textSearch('fts', q, { type: 'websearch', config: 'english' });
    if (category) query = query.eq('category', category);
    if (area)     query = query.ilike('area', `%${area}%`);
    if (price === 'free') query = query.ilike('price', '%free%');

    // Date filters
    if (date === 'today') {
      query = query.eq('event_date', todayStr);
    } else if (date === 'weekend') {
      const d = new Date();
      const sat = new Date(d); sat.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
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

    // Helper: pick better of two duplicate items (most relevant date)
    function pickBetter(a, b) {
      if (date?.match(/^\d{4}-\d{2}-\d{2}$/)) {
        if (a.event_date === date) return a;
        if (b.event_date === date) return b;
      }
      const aD = a.event_date ? new Date(a.event_date) : null;
      const bD = b.event_date ? new Date(b.event_date) : null;
      if (!aD && bD) return b;
      if (!bD)       return a;
      const aUp = aD >= todayDate, bUp = bD >= todayDate;
      if (aUp && !bUp) return a;
      if (!aUp && bUp) return b;
      return aUp ? (aD <= bD ? a : b) : (aD >= bD ? a : b);
    }

    // Pass 1 — junk filter
    const clean = (data || []).filter(item => !isJunk(item));

    // Pass 2 — dedup by base URL
    const byUrl = {};
    for (const item of clean) {
      const key = baseUrl(item.url);
      byUrl[key] = byUrl[key] ? pickBetter(byUrl[key], item) : item;
    }

    // Pass 3 — dedup by source + normalized title
    const byTitle = {};
    for (const item of Object.values(byUrl)) {
      const key = `${item.source_name}::${normTitle(item.title, item.source_name)}`;
      byTitle[key] = byTitle[key] ? pickBetter(byTitle[key], item) : item;
    }

    // Normalise shape
    const results = Object.values(byTitle).map(item => ({
      ...item,
      description:    item.summary,
      destinationUrl: item.url,
      listingType:    item.listing_type || 'standard',
      isMonetized:    item.is_monetized || false,
      isFeatured:     item.listing_type === 'featured',
      isPartner:      item.listing_type === 'partner',
    }));

    return NextResponse.json({ results, count: results.length, source: 'trusted_items' });
  } catch (err) {
    console.error('Search error:', err.message);
    return NextResponse.json({ results: [], error: err.message }, { status: 500 });
  }
}
