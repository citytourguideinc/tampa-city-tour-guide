// app/api/admin/analytics/route.js
// Returns live analytics: record counts by category, totals, and search health
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

const SECRET = process.env.ADMIN_SECRET || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'citytourguide2026';

async function auth(req) {
  const h = req.headers.get('x-admin-secret');
  if (h === SECRET) return true;
  const cookieStore = await cookies();
  return cookieStore.get('ctg_admin_auth')?.value === SECRET;
}

export async function GET(req) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  // ── Category counts from Tampa Resources ────────────────────────────────────
  const { data: catData, error: catErr } = await supabase
    .from('Tampa Resources')
    .select('Category')
    .not('Category', 'is', null);

  const categoryCounts = {};
  let total = 0;
  if (catData) {
    for (const row of catData) {
      const cat = row.Category || 'Unknown';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      total++;
    }
  }

  // Sort by count descending
  const categories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({ name, count }));

  // ── Sources count ───────────────────────────────────────────────────────────
  const { count: sourcesCount } = await supabase
    .from('sources')
    .select('*', { count: 'exact', head: true });

  // ── Trusted items count ─────────────────────────────────────────────────────
  const { count: itemsCount } = await supabase
    .from('trusted_items')
    .select('*', { count: 'exact', head: true });

  return NextResponse.json({
    tampaResources: { total, categories },
    sources: sourcesCount || 0,
    trustedItems: itemsCount || 0,
    generatedAt: new Date().toISOString(),
  });
}
