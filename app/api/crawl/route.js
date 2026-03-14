// app/api/crawl/route.js
// POST /api/crawl — Trusted source crawler
// Requires header: x-crawl-secret: <CRAWL_SECRET env var>
// Body (optional): { sourceNames: ['Tampa Downtown Partnership'] }
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { crawlSource }    from '@/lib/crawler';
import { extractPage }    from '@/lib/extractor';
import SOURCES            from '@/lib/trusted-sources.json';

const MAX_PAGES_PER_SOURCE = 50;

export async function POST(request) {
  // ── Auth check ──────────────────────────────────────────────────────────
  const secret = process.env.CRAWL_SECRET;
  if (secret && request.headers.get('x-crawl-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Database admin client not configured. Set SUPABASE_SERVICE_ROLE_KEY.' }, { status: 503 });
  }

  // ── Parse body ───────────────────────────────────────────────────────────
  let body = {};
  try { body = await request.json(); } catch {}
  const { sourceNames } = body;

  // ── Select sources ────────────────────────────────────────────────────── 
  const sources = SOURCES.filter(s =>
    s.active &&
    (!sourceNames || sourceNames.includes(s.sourceName))
  );

  if (!sources.length) {
    return NextResponse.json({ error: 'No active sources found' }, { status: 404 });
  }

  const report = [];

  for (const source of sources) {
    const sourceReport = {
      sourceName: source.sourceName,
      domain: source.domain,
      pagesVisited: 0,
      itemsExtracted: 0,
      skipped: 0,
      errors: [],
    };

    try {
      // ── Ensure source is registered in Supabase ──────────────────────────
      const { data: existingSource } = await admin
        .from('trusted_sources')
        .select('id')
        .eq('domain', source.domain)
        .single();

      let sourceId = existingSource?.id;

      if (!sourceId) {
        const { data: inserted, error: insertErr } = await admin
          .from('trusted_sources')
          .insert({
            source_name:    source.sourceName,
            main_url:       source.mainUrl,
            domain:         source.domain,
            source_type:    source.sourceType,
            allowed_depth:  source.allowedDepth,
            allowed_paths:  source.allowedPaths,
            blocked_paths:  source.blockedPaths,
            subsources:     source.subsources,
            active:         source.active,
            city:           source.city,
          })
          .select('id')
          .single();

        if (insertErr) throw new Error(`Failed to register source: ${insertErr.message}`);
        sourceId = inserted.id;
      }

      // ── Crawl ─────────────────────────────────────────────────────────────
      const pages = await crawlSource(source);
      sourceReport.pagesVisited = pages.length;

      // Limit to MAX_PAGES_PER_SOURCE to control cost/time
      const toProcess = pages.slice(0, MAX_PAGES_PER_SOURCE);

      for (const { url, html, subsource } of toProcess) {
        try {
          const item = extractPage(html, url, source, subsource);

          // Skip pages without meaningful title
          if (!item.title || item.title.length < 3) {
            sourceReport.skipped++;
            continue;
          }

          // Skip uncategorized news/internal pages
          if (item.category === null) {
            sourceReport.skipped++;
            continue;
          }

          const { error: upsertErr } = await admin
            .from('trusted_items')
            .upsert({
              source_id:     sourceId,
              source_name:   item.source_name,
              source_domain: item.source_domain,
              source_type:   item.source_type,
              title:         item.title,
              url:           item.url,
              category:      item.category,
              subcategory:   item.subcategory,
              location:      item.location,
              area:          item.area,
              price:         item.price,
              event_date:    item.event_date,
              audience:      item.audience,
              summary:       item.summary,
              listing_type:  item.listing_type,
              is_external:   item.is_external,
              is_monetized:  item.is_monetized,
              city:          item.city,
              crawled_at:    new Date().toISOString(),
            }, { onConflict: 'url' });

          if (upsertErr) {
            sourceReport.errors.push(`Upsert error for ${url}: ${upsertErr.message}`);
          } else {
            sourceReport.itemsExtracted++;
          }
        } catch (itemErr) {
          sourceReport.errors.push(`Extract error for ${url}: ${itemErr.message}`);
        }
      }
    } catch (sourceErr) {
      sourceReport.errors.push(`Source-level error: ${sourceErr.message}`);
    }

    report.push(sourceReport);
  }

  return NextResponse.json({
    success: true,
    crawledAt: new Date().toISOString(),
    report,
  });
}

// GET — health check / status
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    sources: SOURCES.filter(s => s.active).map(s => ({
      name: s.sourceName,
      domain: s.domain,
      subsources: (s.subsources || []).length,
    })),
  });
}
