// app/api/admin/activities/route.js
// Protected admin API for activities CRUD
// In production, add proper auth (Supabase JWT / middleware)
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

function getAdmin() {
  const client = getAdminClient();
  if (!client) return null;
  return client;
}

// GET — list all activities (including inactive)
export async function GET() {
  const sb = getAdmin();
  if (!sb) return NextResponse.json({ activities: [] });
  const { data, error } = await sb
    .from('activities')
    .select('id, activity_name, category, neighborhood, source_name, icon, active_status, featured_status, city')
    .order('category')
    .order('activity_name');
  if (error) return NextResponse.json({ activities: [], error: error.message }, { status: 500 });
  return NextResponse.json({ activities: data });
}

// POST — add new activity
export async function POST(req) {
  const sb = getAdmin();
  if (!sb) return NextResponse.json({ error: 'Database not connected' }, { status: 503 });
  const body = await req.json();
  const { data, error } = await sb
    .from('activities')
    .insert({ ...body, active_status: body.active_status ?? true })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ activity: data });
}

// PATCH — update active_status or featured_status
export async function PATCH(req) {
  const sb = getAdmin();
  if (!sb) return NextResponse.json({ error: 'Database not connected' }, { status: 503 });
  const { id, ...updates } = await req.json();
  const { error } = await sb.from('activities').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

// DELETE — remove activity
export async function DELETE(req) {
  const sb = getAdmin();
  if (!sb) return NextResponse.json({ error: 'Database not connected' }, { status: 503 });
  const { id } = await req.json();
  const { error } = await sb.from('activities').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
