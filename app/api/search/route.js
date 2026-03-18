// app/api/search/route.js
// Queries the curated 'Tampa Resources' table — same dataset as admin panel
import { NextResponse } from 'next/server';
import { getAdminClient, supabase as anonClient } from '@/lib/supabase';

// ── Category aliases — maps user keywords → exact Category enum values ──────
const CAT_MAP = {
  // Dining
  dining: 'Dining', restaurant: 'Dining', restaurants: 'Dining', food: 'Dining', eat: 'Dining',
  // Events & Activities
  event: 'Events & Activities', events: 'Events & Activities', calendar: 'Events & Activities',
  activity: 'Events & Activities', activities: 'Events & Activities',
  // Things To Do
  'things to do': 'Things To Do', todo: 'Things To Do', things: 'Things To Do',
  outdoor: 'Things To Do', outdoors: 'Things To Do', beach: 'Things To Do', park: 'Things To Do',
  // Arts & Culture
  arts: 'Arts & Culture', art: 'Arts & Culture', culture: 'Arts & Culture',
  museum: 'Arts & Culture', theater: 'Arts & Culture', theatre: 'Arts & Culture',
  // Family & Attractions
  family: 'Family & Attractions', kids: 'Family & Attractions', children: 'Family & Attractions',
  attractions: 'Family & Attractions',
  // Sports
  sport: 'Sports', sports: 'Sports',
  // Venues
  venue: 'Venues', venues: 'Venues', concert: 'Venues',
  // Restaurant Events
  'food events': 'Restaurant Events', 'restaurant events': 'Restaurant Events',
  // Calendars
  calendars: 'Calendars',
  // Transportation
  transport: 'Transportation', transportation: 'Transportation',
};

export async function GET(request) {
  // Try service-role key first (bypasses RLS); fall back to anon client
  const supabase = getAdminClient() || anonClient;
  if (!supabase) return NextResponse.json({ results: [], hint: 'Supabase not configured.' });

  const { searchParams } = new URL(request.url);
  const q        = (searchParams.get('q') || '').trim();
  const category = searchParams.get('category') || '';
  const area     = searchParams.get('area')     || '';
  const price    = searchParams.get('price')    || '';
  const date     = searchParams.get('date')     || '';
  const qLow     = q.toLowerCase();

  try {
    // Select all columns safely so when event_date is added, it doesn't crash existing queries
    let qb = supabase
      .from('Tampa Resources')
      .select('*')
      .not('Resource', 'is', null)
      .not('URL Link', 'is', null)
      .limit(300);

    // ── Category filter ──────────────────────────────────────────────────────
    if (category) {
      qb = qb.ilike('Category', `%${category}%`);
    } else if (q && CAT_MAP[qLow]) {
      qb = qb.ilike('Category', `%${CAT_MAP[qLow]}%`);
    } else if (q) {
      qb = qb.or(`Resource.ilike.%${q}%,Keywords.ilike.%${q}%,Description.ilike.%${q}%`);
    }

    // ── Area filter ──────────────────────────────────────────────────────────
    if (area) qb = qb.ilike('neighborhood', `%${area}%`);

    // ── Price filter ─────────────────────────────────────────────────────────
    if (price === 'free') qb = qb.ilike('Keywords', '%free%');

    qb = qb.order('tier',     { ascending: true, nullsFirst: false })
           .order('Resource', { ascending: true });

    const { data, error } = await qb;
    if (error) throw error;

    // ── Filter dirty / garbage records ───────────────────────────────────────
    const VALID_CATS = new Set([
      'Dining', 'Events & Activities', 'Things To Do', 'Arts & Culture',
      'Family & Attractions', 'Sports', 'Venues', 'Restaurant Events',
      'Calendars', 'Transportation',
    ]);
    let clean = (data || []).filter(r =>
      r.Resource && r.Resource.length > 3 &&
      r['URL Link'] && r['URL Link'].startsWith('http') &&
      VALID_CATS.has(r.Category)
    );

    // ── Strict Date Filter ───────────────────────────────────────────────────
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
        // Precise YYYY-MM-DD string
        targetStart = new Date(date + 'T00:00:00');
        targetEnd = new Date(date + 'T23:59:59');
      }

      clean = clean.filter(r => {
        // If the resource doesn't have an event_date yet, exclude it from strict date searches
        if (!r.event_date) return false;
        
        const rDate = new Date(r.event_date + 'T12:00:00'); // Use noon to avoid timezone shift dropping it back a day
        return rDate >= targetStart && rDate <= targetEnd;
      });
    }

    // ── Normalize to frontend-expected shape ─────────────────────────────────
    const results = clean.map(r => {
      const isFree = (r.Keywords || '').toLowerCase().includes('free');
      
      return {
        id:             r.tables_record_id,
        title:          r.Resource,
        category:       r.Category,
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
        event_date:     r.event_date || null, // Will automatically populate once column is added to Supabase
      };
    });

    return NextResponse.json({ results, count: results.length, source: 'Tampa Resources' });
  } catch (err) {
    console.error('Search error:', err.message);
    return NextResponse.json({ results: [], error: err.message }, { status: 500 });
  }
}
