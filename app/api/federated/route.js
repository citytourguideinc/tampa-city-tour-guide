// app/api/federated/route.js
// Orchestrates parallel calls to GYG + Viator APIs,
// merges with Supabase curated results, caches 1 hour.
import { NextResponse } from 'next/server';
import { supabase, getAdminClient } from '@/lib/supabase';
import { searchGYG }    from '@/lib/adapters/getyourguide';
import { searchViator } from '@/lib/adapters/viator';

const CACHE_TTL_SECONDS = 3600; // 1 hour

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q    = searchParams.get('q')    || '';
  const city = searchParams.get('city') || 'Tampa';

  const cacheKey = `federated:${city}:${q.toLowerCase().trim()}`;

  // 1. Check cache
  if (supabase) {
    const { data: cached } = await supabase
      .from('search_cache')
      .select('results, expires_at')
      .eq('query_key', cacheKey)
      .single();
    if (cached && new Date(cached.expires_at) > new Date()) {
      return NextResponse.json({ results: cached.results, source: 'cache' });
    }
  }

  // 2. Fan out in parallel: GYG + Viator + Supabase
  const [gygResults, viatorResults, supabaseResults] = await Promise.allSettled([
    searchGYG(q, city),
    searchViator(q, city),
    fetchSupabase(q, city),
  ]);

  const gyg     = gygResults.status     === 'fulfilled' ? gygResults.value     : [];
  const viator  = viatorResults.status  === 'fulfilled' ? viatorResults.value  : [];
  const curated = supabaseResults.status === 'fulfilled' ? supabaseResults.value : [];

  // 3. Merge + deduplicate by name similarity
  const merged = dedup([...curated, ...gyg, ...viator]);

  // 4. Sort: featured first, then affiliate, then curated
  merged.sort((a, b) => {
    if (a.featured_status && !b.featured_status) return -1;
    if (!a.featured_status && b.featured_status) return 1;
    if (a.source_type === 'affiliate' && b.source_type !== 'affiliate') return -1;
    if (a.source_type !== 'affiliate' && b.source_type === 'affiliate') return 1;
    return 0;
  });

  // 5. Cache result
  if (supabase) {
    const admin = getAdminClient();
    if (admin) {
      const expiresAt = new Date(Date.now() + CACHE_TTL_SECONDS * 1000).toISOString();
      await admin.from('search_cache').upsert({ query_key: cacheKey, results: merged, expires_at: expiresAt });
    }
  }

  return NextResponse.json({ results: merged, source: 'live', counts: { curated: curated.length, gyg: gyg.length, viator: viator.length } });
}

/** Fetch curated results from Supabase */
async function fetchSupabase(q, city) {
  if (!supabase) return [];
  let query = supabase
    .from('activities')
    .select('*')
    .eq('city', city)
    .eq('active_status', true)
    .order('featured_status', { ascending: false })
    .limit(30);
  if (q) {
    query = query.textSearch('fts', q, { type: 'websearch', config: 'english' });
  }
  const { data } = await query;
  return (data || []).map(a => ({ ...a, source_type: a.source_type || 'curated' }));
}

/** Remove duplicate activities by normalizing title */
function dedup(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = item.activity_name?.toLowerCase().replace(/\s+/g, '').slice(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
