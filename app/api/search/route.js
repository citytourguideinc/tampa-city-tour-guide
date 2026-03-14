// app/api/search/route.js — Trusted-items search: current-only, 3-pass dedup, junk filter
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function baseUrl(u) {
  try {
    const url = new URL(u);
    url.searchParams.delete('occurrence');
    url.searchParams.delete('time');
    return url.search === '?' ? url.origin + url.pathname : url.href;
  } catch { return u; }
}

function normTitle(t, src) {
  if (!t) return '';
  const srcWord = (src || '').split(' ')[0].toLowerCase();
  return t.toLowerCase()
    .replace(new RegExp(`[-–|·]\\s*${srcWord}.*$`), '')
    .replace(/[-–|·]\s*(tampa|downtown|partnership).*$/i, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 50);
}

// WordPress index/archive/navigation pages — no unique content
const JUNK_TITLE = [/\barchives?\b/i, /^all\s+\w/i, /\bpage\s+\d+/i, /^(events|news|newsletter|monday morning memo|insider|memo)$/i];
const JUNK_URL   = [/\/page\/\d+\//, /\?paged=\d+/, /\/wp-json\//, /\/feed\//];
function isJunk(item) {
  return JUNK_TITLE.some(p => p.test(item.title || '')) || JUNK_URL.some(p => p.test(item.url || ''));
}

// Non-event categories — these don't have event dates, keep them always
const NEWS_CATEGORIES = ['Discovery', 'News', 'Community'];
function isNewsType(item) {
  return NEWS_CATEGORIES.some(c => (item.category || '').toLowerCase().includes(c.toLowerCase()));
}

export async function GET(request) {
  if (!supabase) return NextResponse.json({ results: [], hint: 'Supabase not configured.' });

  const { searchParams } = new URL(request.url);
  const q        = searchParams.get('q')?.trim();
  const category = searchParams.get('category');
  const area     = searchParams.get('area');
  const date     = searchParams.get('date');
  const price    = searchParams.get('price');

  const todayStr  = new Date().toISOString().slice(0, 10);
  const todayDate = new Date(todayStr);

  try {
    let query = supabase
      .from('trusted_items')
      .select('id,title,url,source_name,source_domain,category,subcategory,area,price,event_date,summary,listing_type,is_monetized,status')
      .eq('status', 'approved')
      .limit(300);

    if (q)        query = query.textSearch('fts', q, { type: 'websearch', config: 'english' });
    if (category) query = query.eq('category', category);
    if (area)     query = query.ilike('area', `%${area}%`);
    if (price === 'free') query = query.ilike('price', '%free%');

    // Date filters — applied at DB level
    if (date === 'today') {
      query = query.eq('event_date', todayStr);
    } else if (date === 'weekend') {
      const d = new Date();
      const sat = new Date(d); sat.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
      const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
      query = query.gte('event_date', sat.toISOString().slice(0,10)).lte('event_date', sun.toISOString().slice(0,10));
    } else if (date?.match(/^\d{4}-\d{2}-\d{2}$/)) {
      query = query.eq('event_date', date);
    }

    query = query
      .order('listing_type', { ascending: false })
      .order('event_date',   { ascending: true, nullsFirst: false })
      .order('title',        { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

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

    // Pass 1: remove junk index/archive pages
    const clean = (data || []).filter(item => !isJunk(item));

    // Pass 2: remove PAST events (but keep news/discovery items regardless of date)
    const current = clean.filter(item => {
      if (!item.event_date) return true;             // no date = always show (news, info pages)
      if (isNewsType(item)) return true;             // news/discovery = always show
      return new Date(item.event_date) >= todayDate; // events = current/upcoming only
    });

    // Pass 3: dedup by base URL
    const byUrl = {};
    for (const item of current) {
      const key = baseUrl(item.url);
      byUrl[key] = byUrl[key] ? pickBetter(byUrl[key], item) : item;
    }

    // Pass 4: dedup by source + normalized title
    const byTitle = {};
    for (const item of Object.values(byUrl)) {
      const key = `${item.source_name}::${normTitle(item.title, item.source_name)}`;
      byTitle[key] = byTitle[key] ? pickBetter(byTitle[key], item) : item;
    }

    // Normalise + tag news items
    const results = Object.values(byTitle).map(item => ({
      ...item,
      description:    item.summary,
      destinationUrl: item.url,
      listingType:    item.listing_type || 'standard',
      isMonetized:    item.is_monetized || false,
      isFeatured:     item.listing_type === 'featured',
      isPartner:      item.listing_type === 'partner',
      isNews:         isNewsType(item) && !item.event_date, // flag for UI badge
    }));

    return NextResponse.json({ results, count: results.length, source: 'trusted_items' });
  } catch (err) {
    console.error('Search error:', err.message);
    return NextResponse.json({ results: [], error: err.message }, { status: 500 });
  }
}
