// app/api/admin/sources/route.js
// GET  /api/admin/sources — list all trusted sources with item counts
// POST /api/admin/sources — add new source
// PATCH /api/admin/sources — toggle active status
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

function authCheck(request) {
  const secret = process.env.ADMIN_SECRET || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'citytourguide2026';
  const h = request.headers.get('x-admin-secret');
  const q = new URL(request.url).searchParams.get('key');
  return h === secret || q === secret;
}

export async function GET(request) {
  if (!authCheck(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  // Sources with item count per source
  const { data: sources, error } = await admin
    .from('trusted_sources')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Count items per source
  const counts = await Promise.all(
    (sources || []).map(async s => {
      const { count } = await admin
        .from('trusted_items')
        .select('id', { count: 'exact', head: true })
        .eq('source_id', s.id);
      return { id: s.id, count: count || 0 };
    })
  );

  const countMap = Object.fromEntries(counts.map(c => [c.id, c.count]));
  const result = (sources || []).map(s => ({ ...s, item_count: countMap[s.id] || 0 }));

  return NextResponse.json({ sources: result });
}

export async function PATCH(request) {
  if (!authCheck(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { id, active, allowed_depth, blocked_paths } = await request.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const updates = {};
  if (active !== undefined)       updates.active = active;
  if (allowed_depth !== undefined) updates.allowed_depth = allowed_depth;
  if (blocked_paths !== undefined) updates.blocked_paths = blocked_paths;

  const { data, error } = await admin
    .from('trusted_sources')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ source: data });
}

export async function POST(request) {
  if (!authCheck(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await request.json();
  const { data, error } = await admin
    .from('trusted_sources')
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ source: data }, { status: 201 });
}
