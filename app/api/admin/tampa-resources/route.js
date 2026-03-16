// app/api/admin/tampa-resources/route.js
// Backs the 🗂 Tampa Resources tab in the admin panel
// GET  → list Tampa Resources (filtered) OR list source_candidates (candidates=1)
// PATCH → update a Tampa Resources record (tier, is_core, status)
// POST  → approve or reject a source_candidate

import { getAdminClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const TABLE   = 'Tampa Resources';
const CANDS   = 'source_candidates';
const SECRET  = process.env.ADMIN_SECRET || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'citytourguide2026';

function auth(req) {
  const h = req.headers.get('x-admin-secret');
  return h === SECRET;
}

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getAdminClient();
  if (!supabase)  return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const { searchParams } = new URL(req.url);

  // ── Candidates queue ──
  if (searchParams.get('candidates') === '1') {
    const { data, error } = await supabase
      .from(CANDS)
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ candidates: data });
  }

  // ── Tampa Resources list ──
  const page     = parseInt(searchParams.get('page')  || '0');
  const limit    = parseInt(searchParams.get('limit') || '30');
  const q        = searchParams.get('q')           || '';
  const nbhd     = searchParams.get('neighborhood') || '';
  const cat      = searchParams.get('category')    || '';
  const status   = searchParams.get('status')      || '';
  const tier     = searchParams.get('tier')        || '';
  const is_core  = searchParams.get('is_core')     || '';
  const evt_type = searchParams.get('event_type')  || '';

  let query = supabase
    .from(TABLE)
    .select('tables_record_id, Resource, Category, "URL Link", neighborhood, tier, is_core, status, url_broken, event_type', { count: 'exact' });

  if (q)        query = query.or(`Resource.ilike.%${q}%,Keywords.ilike.%${q}%`);
  if (nbhd)     query = query.eq('neighborhood', nbhd);
  if (cat)      query = query.eq('Category', cat);
  if (status)   query = query.eq('status', status);
  if (tier)     query = query.eq('tier', tier);
  if (is_core === 'true')  query = query.eq('is_core', true);
  if (is_core === 'false') query = query.eq('is_core', false);
  if (evt_type) query = query.eq('event_type', evt_type);

  query = query.range(page * limit, page * limit + limit - 1).order('neighborhood').order('Resource');

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ resources: data, total: count });
}

// ── PATCH — update a Tampa Resources record ───────────────────────────────────
export async function PATCH(req) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getAdminClient();
  if (!supabase)  return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  // Only allow safe columns to be patched
  const allowed = ['tier', 'is_core', 'status', 'url_broken', 'admin_notes', 'event_type', 'source_type'];
  const safe = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));

  const { error } = await supabase
    .from(TABLE)
    .update({ ...safe, tables_updated_at: new Date().toISOString() })
    .eq('tables_record_id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// ── POST — approve or reject a source_candidate ───────────────────────────────
export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getAdminClient();
  if (!supabase)  return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const { candidateId, action, rejection_reason } = await req.json();
  if (!candidateId || !action) return NextResponse.json({ error: 'candidateId and action required' }, { status: 400 });

  if (action === 'approve') {
    // Fetch the candidate
    const { data: cand, error: fetchErr } = await supabase
      .from(CANDS)
      .select('*')
      .eq('id', candidateId)
      .single();
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

    // Insert into Tampa Resources
    const insert = {
      Resource:        cand.name,
      Category:        cand.category,
      Subcategory:     cand.subcategory,
      Description:     cand.description,
      Keywords:        cand.keywords,
      'URL Link':      cand.url,
      url_specials:    cand.url_specials,
      url_brunch:      cand.url_brunch,
      url_google_maps: cand.url_google_maps,
      url_facebook:    cand.url_facebook,
      url_instagram:   cand.url_instagram,
      day_of_week:     cand.day_of_week,
      time_start:      cand.time_start,
      time_end:        cand.time_end,
      time_keywords:   cand.time_keywords,
      neighborhood:    cand.neighborhood,
      crawl_method:    cand.crawl_method || 'fetch',
      tier:            cand.tier || 'standard',
      is_core:         cand.is_core || false,
      status:          'active',
      source_type:     cand.source_type,
      event_type:      cand.event_type,
      'Chatbot Mapping': cand.chatbot_mapping,
    };

    const { error: insertErr } = await supabase.from(TABLE).insert(insert);
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Mark candidate as approved or rejected
  const { error: updateErr } = await supabase
    .from(CANDS)
    .update({
      status:           action === 'approve' ? 'approved' : 'rejected',
      rejection_reason: rejection_reason || null,
      reviewed_at:      new Date().toISOString(),
    })
    .eq('id', candidateId);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, action });
}
