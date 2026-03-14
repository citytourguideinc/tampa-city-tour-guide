// app/api/search/meta/route.js — Returns available categories, subcategories, and date range
// from indexed trusted_items so UI filters show only what actually exists in the DB
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  if (!supabase) return NextResponse.json({ categories: [], dates: [] });

  try {
    // Distinct categories from approved items
    const { data: catData } = await supabase
      .from('trusted_items')
      .select('category, subcategory')
      .eq('status', 'approved')
      .not('category', 'is', null)
      .order('category');

    // Group subcategories under categories
    const catMap = {};
    for (const row of catData || []) {
      if (!catMap[row.category]) catMap[row.category] = new Set();
      if (row.subcategory) catMap[row.category].add(row.subcategory);
    }
    const categories = Object.entries(catMap).map(([cat, subs]) => ({
      name: cat,
      subcategories: Array.from(subs).sort(),
      count: catData.filter(r => r.category === cat).length,
    })).sort((a, b) => a.name.localeCompare(b.name));

    // Earliest and latest event dates
    const { data: dateData } = await supabase
      .from('trusted_items')
      .select('event_date')
      .eq('status', 'approved')
      .not('event_date', 'is', null)
      .order('event_date', { ascending: true });

    const dates = (dateData || []).map(r => r.event_date).filter(Boolean);
    const minDate = dates[0] || null;
    const maxDate = dates[dates.length - 1] || null;

    // Distinct areas
    const { data: areaData } = await supabase
      .from('trusted_items')
      .select('area')
      .eq('status', 'approved')
      .not('area', 'is', null)
      .order('area');

    const areas = [...new Set((areaData || []).map(r => r.area).filter(Boolean))].sort();

    return NextResponse.json({ categories, areas, minDate, maxDate });
  } catch (err) {
    console.error('Meta error:', err.message);
    return NextResponse.json({ categories: [], areas: [], minDate: null, maxDate: null });
  }
}
