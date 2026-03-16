// app/api/search/route.js — reliable ilike-based search (no broken FTS dependency)
import { NextResponse } from 'next/server';
import { supabase }     from '@/lib/supabase';

// ── Helpers ────────────────────────────────────────────────────────────────────
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

const JUNK_TITLE = [/\barchives?\b/i, /^all\s+\w/i, /\bpage\s+\d+/i,
  /^(events|news|newsletter|monday\s+morning\s+memo|insider|memo)$/i];
const JUNK_URL = [/\/page\/\d+\//, /\?paged=\d+/, /\/wp-json\//, /\/feed\//];
function isJunk(item) {
  return JUNK_TITLE.some(p => p.test(item.title || '')) ||
         JUNK_URL.some(p => p.test(item.url || ''));
}

const ALWAYS_SHOW = ['Discovery', 'News', 'Community'];
function isAlwaysShow(item) {
  return ALWAYS_SHOW.some(c => (item.category || '').toLowerCase().includes(c.toLowerCase()));
}

// keyword → exact category name (makes 'tours' find 'Tours & Activities' items)
const CAT_MAP = {
  tour: 'Tours & Activities', tours: 'Tours & Activities',
  activity: 'Tours & Activities', activities: 'Tours & Activities',
  'things to do': 'Things To Do', todo: 'Things To Do',
  restaurant: 'Food', restaurants: 'Food',
  dining: 'Food', food: 'Food',
  event: 'Events', events: 'Events', calendar: 'Events',
  art: 'Arts', arts: 'Arts', culture: 'Arts',
  music: 'Events', concert: 'Events', live: 'Events',
  nightlife: 'Nightlife', night: 'Nightlife', bar: 'Nightlife', bars: 'Nightlife',
  shop: 'Shopping', shopping: 'Shopping',
  sport: 'Sports', sports: 'Sports', recreation: 'Sports',
  family: 'Family', kids: 'Family', children: 'Family',
  free: 'Events', outdoor: 'Things To Do', outdoors: 'Things To Do',
  museum: 'Arts', theater: 'Arts', theatre: 'Arts',
  beach: 'Things To Do', park: 'Things To Do',
  hotel: 'Discovery', hotels: 'Discovery',
};

// ── Main handler ───────────────────────────────────────────────────────────────
export async function GET(request) {
  if (!supabase) return NextResponse.json({ results: [], hint: 'Supabase not configured.' });

  const { searchParams } = new URL(request.url);
  const q        = (searchParams.get('q') || '').trim();
  const category = searchParams.get('category') || '';
  const area     = searchParams.get('area')     || '';
  const date     = searchParams.get('date')     || '';
  const price    = searchParams.get('price')    || '';

  const todayStr  = new Date().toISOString().slice(0, 10);
  const todayDate = new Date(todayStr);
  const qLow      = q.toLowerCase();

  try {
    // ── Base select ──────────────────────────────────────────────────────────
    const SELECT = 'id,title,url,source_name,source_domain,category,subcategory,area,price,event_date,summary,listing_type,is_monetized,status';

    function makeQuery() {
      return supabase.from('trusted_items').select(SELECT).eq('status', 'approved').limit(300);
    }

    let qb = makeQuery();

    // ── Category filter (from dropdown) ──────────────────────────────────────
    if (category) {
      qb = qb.ilike('category', `%${category}%`);

    // ── Keyword → category alias ─────────────────────────────────────────────
    } else if (q && CAT_MAP[qLow]) {
      qb = qb.ilike('category', `%${CAT_MAP[qLow]}%`)
             .neq('subcategory', 'Neighborhoods');

    // ── Free-text: title OR summary OR subcategory ilike ─────────────────────
    } else if (q) {
      qb = qb.or(`title.ilike.%${q}%,summary.ilike.%${q}%,subcategory.ilike.%${q}%`)
             .neq('subcategory', 'Neighborhoods');
    }

    // ── Area filter ──────────────────────────────────────────────────────────
    if (area) qb = qb.ilike('area', `%${area}%`);

    // ── Price filter ─────────────────────────────────────────────────────────
    if (price === 'free') qb = qb.ilike('price', '%free%');

    // ── Date filters ─────────────────────────────────────────────────────────
    if (date === 'today') {
      qb = qb.eq('event_date', todayStr);
    } else if (date === 'weekend') {
      const d = new Date();
      const sat = new Date(d); sat.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
      const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
      qb = qb.gte('event_date', sat.toISOString().slice(0, 10))
             .lte('event_date', sun.toISOString().slice(0, 10));
    } else if (date?.match(/^\d{4}-\d{2}-\d{2}$/)) {
      qb = qb.eq('event_date', date);
    }

    qb = qb.order('listing_type', { ascending: false })
           .order('event_date',   { ascending: true, nullsFirst: false })
           .order('title',        { ascending: true });

    const { data, error } = await qb;
    if (error) throw error;

    // ── Post-processing ──────────────────────────────────────────────────────
    function pickBetter(a, b) {
      const aD = a.event_date ? new Date(a.event_date) : null;
      const bD = b.event_date ? new Date(b.event_date) : null;
      if (!aD && bD) return b;
      if (!bD)       return a;
      const aUp = aD >= todayDate, bUp = bD >= todayDate;
      if (aUp && !bUp) return a;
      if (!aUp && bUp) return b;
      return aUp ? (aD <= bD ? a : b) : (aD >= bD ? a : b);
    }

    // Pass 1: remove junk
    const clean = (data || []).filter(item => !isJunk(item));

    // Pass 2: filter past events (keep discovery/news items regardless)
    const current = clean.filter(item => {
      if (!item.event_date) return true;
      if (isAlwaysShow(item)) return true;
      return new Date(item.event_date) >= todayDate;
    });

    // Pass 3: dedup by URL
    const byUrl = {};
    for (const item of current) {
      const key = baseUrl(item.url);
      byUrl[key] = byUrl[key] ? pickBetter(byUrl[key], item) : item;
    }

    // Pass 4: dedup by source + title
    const byTitle = {};
    for (const item of Object.values(byUrl)) {
      const key = `${item.source_name}::${normTitle(item.title, item.source_name)}`;
      byTitle[key] = byTitle[key] ? pickBetter(byTitle[key], item) : item;
    }

    const results = Object.values(byTitle).map(item => ({
      ...item,
      description:    item.summary,
      destinationUrl: item.url,
      listingType:    item.listing_type || 'standard',
      isMonetized:    item.is_monetized || false,
      isFeatured:     item.listing_type === 'featured',
      isPartner:      item.listing_type === 'partner',
      isNews:         isAlwaysShow(item) && !item.event_date,
    }));

    return NextResponse.json({ results, count: results.length, source: 'trusted_items' });
  } catch (err) {
    console.error('Search error:', err.message);
    return NextResponse.json({ results: [], error: err.message }, { status: 500 });
  }
}
