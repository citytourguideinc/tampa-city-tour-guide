// app/api/search/route.js — Filter-based Supabase search
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
  const q         = searchParams.get('q')?.trim();
  const city      = searchParams.get('city')      || 'Tampa';
  const category  = searchParams.get('category');
  const area      = searchParams.get('area');
  const date      = searchParams.get('date');
  const price_max = searchParams.get('price_max');
  const tag       = searchParams.get('tag');

  // Fallback if Supabase not configured — return empty with hint
  if (!supabase) {
    return NextResponse.json({ results: [], hint: 'Database not connected. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to Vercel env vars.' });
  }

  try {
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

    // Price filter — join with tours table
    if (price_max !== null && price_max !== '') {
      query = query.lte('tours.price_min', Number(price_max));
    }

    // Free filter
    if (price_max === '0') query = query.eq('tours.price_min', 0);

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
          activity_name: featuredName,
          booking_link:  featuredUrl,
          category:      process.env.FEATURED_VENDOR_SUB || 'Featured Partner',
          icon:          process.env.FEATURED_VENDOR_ICON || '⭐',
          featured_status: true,
          source_name:   'Sponsored',
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
