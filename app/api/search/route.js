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
  const qLow     = q.toLowerCase();

  try {
    // Select from Tampa Resources — no status filter; all curated records are valid
    let qb = supabase
      .from('Tampa Resources')
      .select('tables_record_id, Resource, Category, "URL Link", neighborhood, tier, is_core, Keywords, Description')
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
    const clean = (data || []).filter(r =>
      r.Resource && r.Resource.length > 3 &&
      r['URL Link'] && r['URL Link'].startsWith('http') &&
      VALID_CATS.has(r.Category)
    );

    // ── Normalize to frontend-expected shape ─────────────────────────────────
    const results = clean.map(r => ({
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
      event_date:     null,
    }));

    return NextResponse.json({ results, count: results.length, source: 'Tampa Resources' });
  } catch (err) {
    console.error('Search error:', err.message);
    return NextResponse.json({ results: [], error: err.message }, { status: 500 });
  }
}
