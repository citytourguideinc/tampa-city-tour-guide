// app/api/search/route.js — Filter-based Supabase search + federated API layer
import { NextResponse } from 'next/server';
import { supabase, getAdminClient } from '@/lib/supabase';
import { searchGYG }    from '@/lib/adapters/getyourguide';
import { searchViator } from '@/lib/adapters/viator';

const CACHE_TTL = 3600; // 1 hour in seconds

// Affiliate URL enhancer (same env-var approach from V1)
function enhanceUrl(url, sourceName) {
  const gygId    = process.env.GETYOURGUIDE_PARTNER_ID;
  const viatorId = process.env.VIATOR_AFFILIATE_ID;
  if (!url) return url;
  if (gygId    && url.includes('getyourguide.com')) return url + (url.includes('?') ? '&' : '?') + `partner_id=${gygId}`;
  if (viatorId && url.includes('viator.com'))       return url + (url.includes('?') ? '&' : '?') + `mcid=${viatorId}&pid=P00`;
  return url;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q           = searchParams.get('q')?.trim();
  const city        = searchParams.get('city')        || 'Tampa';
  const category    = searchParams.get('category');
  const area        = searchParams.get('area');
  const date        = searchParams.get('date');
  const price_max   = searchParams.get('price_max');
  const tag         = searchParams.get('tag');
  const source      = searchParams.get('source');      // 'trusted' = query only trusted_items
  const source_type = searchParams.get('source_type'); // filter by sourceType
  const audience    = searchParams.get('audience');    // filter by audience tag

  // Fallback if Supabase not configured — return empty with hint
  if (!supabase) {
    return NextResponse.json({ results: [], hint: 'Database not connected. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to Vercel env vars.' });
  }

  // ── Trusted-source search path ──────────────────────────────────
  // Query ONLY trusted_items (no open web, no affiliate APIs)
  if (source === 'trusted') {
    try {
      let query = supabase
        .from('trusted_items')
        .select('id,title,url,source_name,source_domain,source_type,category,subcategory,area,price,event_date,audience,summary,listing_type,is_external,is_monetized,city')
        .eq('city', city)
        .order('event_date', { ascending: true, nullsFirst: false })
        .limit(30);

      if (q)           query = query.textSearch('fts', q, { type: 'websearch', config: 'english' });
      if (category)    query = query.eq('category', category);
      if (area)        query = query.ilike('area', `%${area}%`);
      if (source_type) query = query.eq('source_type', source_type);
      if (audience)    query = query.contains('audience', [audience]);

      // Price filter: 'free' = price = 'Free'; number = filter by price text
      if (price_max === '0' || price_max === 'free') {
        query = query.ilike('price', '%free%');
      }

      // Date filters
      const today = new Date().toISOString().slice(0, 10);
      if (date === 'today') {
        query = query.eq('event_date', today);
      } else if (date === 'weekend') {
        const d = new Date();
        const sat = new Date(d); sat.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
        const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
        query = query.gte('event_date', sat.toISOString().slice(0, 10))
                     .lte('event_date', sun.toISOString().slice(0, 10));
      } else if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        query = query.eq('event_date', date);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Normalise to common result shape
      const results = (data || []).map(item => ({
        ...item,
        title:         item.title,
        description:   item.summary,
        destinationUrl: item.url,
        ctaLabel:      item.is_external ? 'Visit Source ↗' : 'Learn More ↗',
        listingType:   item.listing_type || 'standard',
        isExternal:    true,
        isMonetized:   false,
        trustedSource: true,
      }));

      return NextResponse.json({ results, source: 'trusted_items', count: results.length });
    } catch (err) {
      console.error('Trusted search error:', err.message);
      return NextResponse.json({ results: [], error: err.message }, { status: 500 });
    }
  }

  try {
    // ── Federated search for text queries (GYG + Viator + Supabase + cache) ──
    if (q) {
      const cacheKey = `search:${city}:${q.toLowerCase().trim()}`;

      // Check 1-hour cache first
      const { data: cached } = await supabase
        .from('search_cache').select('results,expires_at').eq('query_key', cacheKey).single();
      if (cached && new Date(cached.expires_at) > new Date()) {
        return NextResponse.json({ results: cached.results, source: 'cache' });
      }

      // Fan out in parallel
      const [gygRes, viatorRes, sbRes] = await Promise.allSettled([
        searchGYG(q, city),
        searchViator(q, city),
        supabase.from('activities').select('*,tours(price_min,price_max),events(event_date,start_time)')
          .eq('city', city).eq('active_status', true)
          .textSearch('fts', q, { type: 'websearch', config: 'english' })
          .order('featured_status', { ascending: false }).limit(20),
      ]);

      const gyg     = gygRes.status     === 'fulfilled' ? gygRes.value     : [];
      const viator  = viatorRes.status  === 'fulfilled' ? viatorRes.value  : [];
      const sbData  = sbRes.status      === 'fulfilled' ? (sbRes.value.data || []) : [];
      const curated = sbData.map(r => ({ ...r, price_min: r.tours?.[0]?.price_min, price_max: r.tours?.[0]?.price_max, event_date: r.events?.[0]?.event_date, start_time: r.events?.[0]?.start_time }));

      // Merge + deduplicate
      const seen = new Set();
      const merged = [...curated, ...gyg, ...viator].filter(item => {
        const key = item.activity_name?.toLowerCase().replace(/\s+/g, '').slice(0, 30);
        if (seen.has(key)) return false;
        seen.add(key); return true;
      });

      // Sort: featured → affiliate → curated
      merged.sort((a, b) => {
        if (a.featured_status && !b.featured_status) return -1;
        if (!a.featured_status && b.featured_status) return 1;
        if (a.source_type === 'affiliate' && b.source_type !== 'affiliate') return -1;
        if (a.source_type !== 'affiliate' && b.source_type === 'affiliate') return 1;
        return 0;
      });

      // Cache result
      const admin = getAdminClient();
      if (admin) {
        const expiresAt = new Date(Date.now() + CACHE_TTL * 1000).toISOString();
        await admin.from('search_cache').upsert({ query_key: cacheKey, results: merged, expires_at: expiresAt });
      }
      return NextResponse.json({ results: merged, source: 'federated', counts: { curated: curated.length, gyg: gyg.length, viator: viator.length } });
    }

    // ── Filter-only path (no text query) — direct Supabase ──
    let query = supabase
      .from('activities')
      .select(`
        id, activity_name, category, neighborhood, short_summary,
        source_type, source_name, booking_link, official_link,
        icon, featured_status, active_status, lat, lng,
        tours ( price_min, price_max, duration, starting_location ),
        events ( event_date, start_time, end_time )
      `)
      .eq('city', city)
      .eq('active_status', true)
      .order('featured_status', { ascending: false })
      .order('activity_name')
      .limit(24);

    // Full-text search
    if (q) query = query.textSearch('fts', q, { type: 'websearch', config: 'english' });

    // Filters
    if (category) query = query.eq('category', category);
    if (area)     query = query.eq('neighborhood', area);

    // Price filter (for paid tiers like Under $25/$50/$100)
    if (price_max !== null && price_max !== '' && Number(price_max) > 0) {
      query = query.lte('tours.price_min', Number(price_max));
    }

    // Date filter via events join
    if (date === 'weekend') {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysUntilSat = (6 - dayOfWeek + 7) % 7;
      const saturday = new Date(today);
      saturday.setDate(today.getDate() + daysUntilSat);
      const sunday = new Date(saturday);
      sunday.setDate(saturday.getDate() + 1);
      query = query.gte('events.event_date', saturday.toISOString().slice(0, 10))
                   .lte('events.event_date', sunday.toISOString().slice(0, 10));
    } else if (date) {
      query = query.eq('events.event_date', date);
    }

    // Tag filter
    if (tag) {
      const { data: tagRows } = await supabase
        .from('tags').select('id').eq('tag_name', tag).single();
      if (tagRows) {
        const { data: actIds } = await supabase
          .from('activity_tags').select('activity_id').eq('tag_id', tagRows.id);
        const ids = (actIds || []).map(r => r.activity_id);
        if (ids.length) query = query.in('id', ids);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    // Inject featured vendor if configured
    const featuredName = process.env.FEATURED_VENDOR_NAME;
    const featuredUrl  = process.env.FEATURED_VENDOR_URL;
    let results = data || [];

    if (featuredName && featuredUrl) {
      results = [
        {
          id: 'featured',
          title:         featuredName,
          activity_name: featuredName,
          destinationUrl: featuredUrl,
          booking_link:  featuredUrl,
          category:      process.env.FEATURED_VENDOR_SUB || 'Tours & Activities',
          icon:          process.env.FEATURED_VENDOR_ICON || '⭐',
          listingType:   'partner',
          isMonetized:   true,
          isExternal:    true,
          ctaLabel:      'Go to Booking Site ↗',
          featured_status: true,
          source_name:   'Partner Link',
          description:   process.env.FEATURED_VENDOR_DESC || 'A featured Tampa Bay partner listing.',
        },
        ...results,
      ];
    }

    // Apply affiliate URLs
    results = results.map(r => ({
      ...r,
      booking_link: enhanceUrl(r.booking_link, r.source_name),
      official_link: enhanceUrl(r.official_link, r.source_name),
      price_min: r.tours?.[0]?.price_min,
      price_max: r.tours?.[0]?.price_max,
      event_date: r.events?.[0]?.event_date,
      start_time: r.events?.[0]?.start_time,
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error('Search error:', err.message);
    return NextResponse.json({ results: [], error: err.message }, { status: 500 });
  }
}
