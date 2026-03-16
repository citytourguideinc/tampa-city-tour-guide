// app/api/admin/vendors/route.js
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

function authCheck(request) {
  const secret = process.env.ADMIN_SECRET || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'citytourguide2026';
  const h = request.headers.get('x-admin-secret');
  return h === secret;
}

// GET — list all vendors
export async function GET(req) {
  if (!authCheck(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sb = getAdminClient();
  if (!sb) return NextResponse.json({ vendors: [] });
  const { data, error } = await sb
    .from('vendors')
    .select('id, vendor_name, contact_name, email, phone, claim_status, paid_status, created_at')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ vendors: [], error: error.message }, { status: 500 });
  return NextResponse.json({ vendors: data });
}

// PATCH — update claim_status or paid_status
export async function PATCH(req) {
  if (!authCheck(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sb = getAdminClient();
  if (!sb) return NextResponse.json({ error: 'Database not connected' }, { status: 503 });
  const { id, ...updates } = await req.json();
  const { error } = await sb.from('vendors').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
