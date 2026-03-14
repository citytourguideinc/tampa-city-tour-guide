// app/api/search/route.js — Trusted-items-only search (Tampa Downtown Partnership)
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  if (!supabase) {
    return NextResponse.json({ results: [], hint: 'Supabase not configured.' });
  }

  const { searchParams } = new URL(request.url);
  const q        = searchParams.get('q')?.trim();
  const category = searchParams.get('category');
  const area     = searchParams.get('area');
  const date     = searchParams.get('date');   // ISO date string or 'today'/'weekend'
  const price    = searchParams.get('price');  // 'free'
  const limit    = parseInt(searchParams.get('limit') || '60', 10);

  try {
    let query = supabase
      .from('trusted_items')
      .select('id,title,url,source_name,source_domain,category,subcategory,area,price,event_date,audience,summary,listing_type,is_monetized,status')
      .eq('status', 'approved')
      .limit(limit);

    // Full-text search
    if (q) {
      query = query.textSearch('fts', q, { type: 'websearch', config: 'english' });
    }

    // Category filter
    if (category) query = query.eq('category', category);

    // Area filter
    if (area) query = query.ilike('area', `%${area}%`);

    // Price filter
    if (price === 'free') query = query.ilike('price', '%free%');

    // Date filters
    const today = new Date().toISOString().slice(0, 10);
    if (date === 'today') {
      query = query.eq('event_date', today);
    } else if (date === 'weekend') {
      const d = new Date();
      const sat = new Date(d);
      sat.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
      const sun = new Date(sat);
      sun.setDate(sat.getDate() + 1);
      query = query
        .gte('event_date', sat.toISOString().slice(0, 10))
        .lte('event_date', sun.toISOString().slice(0, 10));
    } else if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      query = query.eq('event_date', date);
    }

    // Sort: featured/partner first, then by event_date, then title
    query = query.order('listing_type', { ascending: false })
                 .order('event_date',   { ascending: true, nullsFirst: false })
                 .order('title',        { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    // Normalise shape for UI
    const results = (data || []).map(item => ({
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
