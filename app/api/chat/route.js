// app/api/chat/route.js — Gemini AI + Supabase results
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  const { query, city = 'Tampa' } = await request.json();
  if (!query?.trim()) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey)  return NextResponse.json({ reply: null, results: [] });

  // 1. Fetch context from Supabase (or use empty fallback)
  let dbContext = '';
  if (supabase) {
    const { data } = await supabase
      .from('activities')
      .select('id, activity_name, category, neighborhood, short_summary, source_name')
      .eq('city', city)
      .eq('active_status', true)
      .limit(60);

    if (data?.length) {
      dbContext = data.map((d, i) =>
        `[${i}] ${d.activity_name} (${d.category}${d.neighborhood ? ' · ' + d.neighborhood : ''}) — ${d.short_summary || ''}`
      ).join('\n');
    }
  }

  const prompt = `You are a helpful ${city} city guide assistant.
A visitor asked: "${query.trim()}"

${dbContext ? `Here is the curated database of ${city} activities:\n${dbContext}\n` : ''}
Your task:
1. Write a short, warm 1-2 sentence reply acknowledging what they're looking for.
2. ${dbContext ? 'Select up to 8 most relevant activity indices from the database above.' : 'Suggest what categories or keywords they should explore.'}

Respond ONLY with valid JSON (no markdown):
{"reply":"Your warm response here.","indices":[0,1,2]}`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
        }),
      }
    );

    if (!geminiRes.ok) throw new Error(`Gemini ${geminiRes.status}`);

    const data    = await geminiRes.json();
    const raw     = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match   = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in Gemini response');
    const parsed  = JSON.parse(match[0]);

    // Fetch the matched activities from Supabase by index
    let results = [];
    if (supabase && dbContext && parsed.indices?.length) {
      const { data: allRows } = await supabase
        .from('activities')
        .select(`id, activity_name, category, neighborhood, short_summary, source_name, booking_link, official_link, icon, featured_status,
                 tours ( price_min, price_max ), events ( event_date, start_time )`)
        .eq('city', city)
        .eq('active_status', true)
        .limit(60);

      if (allRows) {
        results = (parsed.indices || [])
          .filter(i => i >= 0 && i < allRows.length)
          .map(i => ({
            ...allRows[i],
            price_min:  allRows[i].tours?.[0]?.price_min,
            price_max:  allRows[i].tours?.[0]?.price_max,
            event_date: allRows[i].events?.[0]?.event_date,
            start_time: allRows[i].events?.[0]?.start_time,
          }));
      }
    }

    return NextResponse.json({ reply: parsed.reply || null, results });
  } catch (err) {
    console.error('Chat API error:', err.message);
    return NextResponse.json({ reply: null, results: [], error: err.message });
  }
}
