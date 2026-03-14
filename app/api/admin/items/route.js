// app/api/admin/items/route.js
// GET   /api/admin/items — list extracted items with filters + pagination
// PATCH /api/admin/items — update listing_type, is_monetized on an item
// DELETE /api/admin/items — remove an item
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

function authCheck(request) {
  const secret = process.env.ADMIN_SECRET || process.env.CRAWL_SECRET;
  if (!secret) return true;
  const h = request.headers.get('x-admin-secret');
  const q = new URL(request.url).searchParams.get('key');
  return h === secret || q === secret;
}

export async function GET(request) {
  if (!authCheck(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { searchParams } = new URL(request.url);
  const source_id    = searchParams.get('source_id');
  const category     = searchParams.get('category');
  const listing_type = searchParams.get('listing_type');
  const q            = searchParams.get('q');
  const page         = parseInt(searchParams.get('page') || '0');
  const limit        = parseInt(searchParams.get('limit') || '25');

  let query = admin
    .from('trusted_items')
    .select('id,title,url,source_name,category,subcategory,area,price,event_date,summary,listing_type,is_monetized,crawled_at', { count: 'exact' })
    .order('crawled_at', { ascending: false })
    .range(page * limit, page * limit + limit - 1);

  if (source_id)    query = query.eq('source_id', source_id);
  if (category)     query = query.eq('category', category);
  if (listing_type) query = query.eq('listing_type', listing_type);
  if (q)            query = query.ilike('title', `%${q}%`);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data || [], total: count || 0, page, limit });
}

export async function PATCH(request) {
  if (!authCheck(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { id, listing_type, is_monetized, title, summary, category } = await request.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const updates = {};
  if (listing_type !== undefined) updates.listing_type = listing_type;
  if (is_monetized !== undefined) updates.is_monetized = is_monetized;
  if (title !== undefined)        updates.title = title;
  if (summary !== undefined)      updates.summary = summary;
  if (category !== undefined)     updates.category = category;

  const { data, error } = await admin
    .from('trusted_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(request) {
  if (!authCheck(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await admin.from('trusted_items').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
