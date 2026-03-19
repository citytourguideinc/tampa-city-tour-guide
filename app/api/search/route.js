// app/api/search/route.js — reliable ilike-based search across BOTH event and static tables
import { NextResponse } from 'next/server';
import { supabase }     from '@/lib/supabase';

// ── Helpers for trusted_items (Crawled Events) ──────────────────────────────
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

// ── Category Aliases ────────────────────────────────────────────────────────
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
    // =========================================================================
    // QUERY 1: "trusted_items" (Crawled dynamic events with dates)
    // =========================================================================
    const SELECT_1 = 'id,title,url,source_name,source_domain,category,subcategory,area,price,event_date,summary,listing_type,is_monetized,status';
    let qb1 = supabase.from('trusted_items').select(SELECT_1).eq('status', 'approved').limit(300);

    if (category) {
      qb1 = qb1.ilike('category', `%${category}%`);
    } else if (q && CAT_MAP[qLow]) {
      qb1 = qb1.ilike('category', `%${CAT_MAP[qLow]}%`).neq('subcategory', 'Neighborhoods');
    } else if (q) {
      qb1 = qb1.or(`title.ilike.%${q}%,summary.ilike.%${q}%,subcategory.ilike.%${q}%`).neq('subcategory', 'Neighborhoods');
    }
    if (area) qb1 = qb1.ilike('area', `%${area}%`);
    if (price === 'free') qb1 = qb1.ilike('price', '%free%');

    // Strict Date Filtering in SQL for trusted_items
    if (date === 'today') {
      qb1 = qb1.eq('event_date', todayStr);
    } else if (date === 'weekend') {
      const d = new Date();
      const sat = new Date(d); sat.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
      const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
      qb1 = qb1.gte('event_date', sat.toISOString().slice(0, 10)).lte('event_date', sun.toISOString().slice(0, 10));
    } else if (date?.match(/^\d{4}-\d{2}-\d{2}$/)) {
      qb1 = qb1.eq('event_date', date);
    }
    qb1 = qb1.order('listing_type', { ascending: false }).order('event_date', { ascending: true, nullsFirst: false }).order('title', { ascending: true });

    // =========================================================================
    // QUERY 2: "Tampa Resources" (Curated static venues/businesses)
    // =========================================================================
    let qb2 = supabase.from('Tampa Resources').select('*').not('Resource', 'is', null).not('URL Link', 'is', null).limit(300);

    const mappedCat = CAT_MAP[qLow] || '';
    if (category) {
      qb2 = qb2.ilike('Category', `%${category}%`);
    } else if (mappedCat) {
      qb2 = qb2.ilike('Category', `%${mappedCat}%`);
    } else if (q) {
      qb2 = qb2.or(`Resource.ilike.%${q}%,Keywords.ilike.%${q}%,Description.ilike.%${q}%`);
    }
    if (area) qb2 = qb2.ilike('neighborhood', `%${area}%`);
    if (price === 'free') qb2 = qb2.ilike('Keywords', '%free%');
    qb2 = qb2.order('tier', { ascending: true, nullsFirst: false }).order('Resource', { ascending: true });


    // RUN BOTH QUERIES CONCURRENTLY
    const [res1, res2] = await Promise.all([qb1, qb2]);
    if (res1.error) throw res1.error;

    // =========================================================================
    // PROCESS 1: trusted_items rules (Dedupe, Drop Past Events)
    // =========================================================================
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

    const clean1 = (res1.data || []).filter(item => !isJunk(item));
    const current1 = clean1.filter(item => {
      if (!item.event_date) return true;
      if (isAlwaysShow(item)) return true;
      return new Date(item.event_date) >= todayDate;
    });

    const byUrl = {};
    for (const item of current1) {
      const key = baseUrl(item.url);
      byUrl[key] = byUrl[key] ? pickBetter(byUrl[key], item) : item;
    }

    const byTitle = {};
    for (const item of Object.values(byUrl)) {
      const key = `${item.source_name}::${normTitle(item.title, item.source_name)}`;
      byTitle[key] = byTitle[key] ? pickBetter(byTitle[key], item) : item;
    }

    const trustedResults = Object.values(byTitle).map(item => ({
      ...item,
      description:    item.summary,
      destinationUrl: item.url,
      listingType:    item.listing_type || 'standard',
      isMonetized:    item.is_monetized || false,
      isFeatured:     item.listing_type === 'featured',
      isPartner:      item.listing_type === 'partner',
      isNews:         isAlwaysShow(item) && !item.event_date,
    }));

    // =========================================================================
    // PROCESS 2: Tampa Resources rules (Map Schema, Enforce JS strict date)
    // =========================================================================
    const TR_VALID_CATS = new Set([
      'Dining', 'Events & Activities', 'Things To Do', 'Arts & Culture',
      'Family & Attractions', 'Sports', 'Venues', 'Restaurant Events',
      'Calendars', 'Transportation',
    ]);

    let clean2 = (res2.data || []).filter(r =>
      r.Resource && r.Resource.length > 3 &&
      r['URL Link'] && r['URL Link'].startsWith('http') &&
      TR_VALID_CATS.has(r.Category)
    );

    // If date filter is strictly active, we must drop Tampa Resources entries that lack a matching event_date
    if (date) {
      let targetStart = null;
      let targetEnd = null;
      const now = new Date();
      if (date === 'today') {
        targetStart = new Date(now.setHours(0,0,0,0));
        targetEnd = new Date(now.setHours(23,59,59,999));
      } else if (date === 'weekend') {
        const day = now.getDay();
        const diffToFriday = day <= 5 ? 5 - day : 6; 
        const friday = new Date(now);
        friday.setDate(now.getDate() + diffToFriday);
        friday.setHours(0,0,0,0);
        const sunday = new Date(friday);
        sunday.setDate(friday.getDate() + 2);
        sunday.setHours(23,59,59,999);
        targetStart = friday;
        targetEnd = sunday;
      } else if (date) {
        targetStart = new Date(date + 'T00:00:00');
        targetEnd = new Date(date + 'T23:59:59');
      }

      clean2 = clean2.filter(r => {
        if (!r.event_date) return false; // Strictly hide dateless venues when a date is picked
        const rDate = new Date(r.event_date + 'T12:00:00'); 
        return rDate >= targetStart && rDate <= targetEnd;
      });
    }

    const curatedResults = clean2.map(r => {
      const isFree = (r.Keywords || '').toLowerCase().includes('free');
      return {
        id:             r.tables_record_id,
        title:          r.Resource,
        category:       r.Category,
        subcategory:    r.Category,
        url:            r['URL Link'],
        destinationUrl: r['URL Link'],
        area:           r.neighborhood,
        source_name:    r.Category || 'Tampa Resources',
        source_domain:  '',
        summary:        r.Description || '',
        description:    r.Description || '',
        listing_type:   r.tier === 1 ? 'featured' : 'standard',
        listingType:    r.tier === 1 ? 'featured' : 'standard',
        isFeatured:     r.tier === 1,
        isPartner:      r.is_core === true,
        isMonetized:    false,
        isNews:         false,
        price:          isFree ? 'Free' : null,
        event_date:     r.event_date || null,
      };
    });

    // =========================================================================
    // COMPILE FINAL RESULTS
    // =========================================================================
    const finalResults = [...trustedResults, ...curatedResults];

    return NextResponse.json({ results: finalResults, count: finalResults.length, source: 'merged' });
  } catch (err) {
    console.error('Search error:', err.message);
    return NextResponse.json({ results: [], error: err.message }, { status: 500 });
  }
}
