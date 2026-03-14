// app/api/crawl/route.js — v2 with diagnostics, review workflow, source health
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { crawlSource }    from '@/lib/crawler';
import { extractPage }    from '@/lib/extractor';
import SOURCES            from '@/lib/trusted-sources.json';

const MAX_PAGES_PER_SOURCE = 60;

function authCheck(req) {
  const s = process.env.CRAWL_SECRET || process.env.ADMIN_SECRET;
  if (!s) return true;
  return req.headers.get('x-crawl-secret') === s || req.headers.get('x-admin-secret') === s;
}

export async function POST(request) {
  if (!authCheck(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'DB admin not configured. Set SUPABASE_SERVICE_ROLE_KEY.' }, { status: 503 });

  let body = {};
  try { body = await request.json(); } catch {}
  const { sourceNames, dryRun = false } = body;

  const sources = SOURCES.filter(s => s.active && (!sourceNames || sourceNames.includes(s.sourceName)));
  if (!sources.length) return NextResponse.json({ error: 'No active sources' }, { status: 404 });

  const report = [];

  for (const source of sources) {
    const sourceReport = {
      sourceName:    source.sourceName,
      domain:        source.domain,
      dryRun,
      diagnostics:   null,
      itemsExtracted: 0,
      duplicatesSkipped: 0,
      skippedNoTitle: 0,
      skippedNoCategory: 0,
      extractionErrors: [],
      sampleItems: [],      // first 5 extracted items for review
      allUrls: [],          // every page visited
    };

    try {
      // ── Register source in Supabase if needed ──────────────────
      let sourceId = null;
      const { data: existing } = await admin
        .from('trusted_sources').select('id').eq('domain', source.domain).single();

      if (existing) {
        sourceId = existing.id;
      } else {
        const { data: inserted, error: ie } = await admin
          .from('trusted_sources')
          .insert({
            source_name: source.sourceName, main_url: source.mainUrl,
            domain: source.domain, source_type: source.sourceType,
            allowed_depth: source.allowedDepth, blocked_paths: source.blockedPaths,
            subsources: source.subsources, active: source.active, city: source.city,
          }).select('id').single();
        if (ie) throw new Error(`Register source: ${ie.message}`);
        sourceId = inserted.id;
      }

      // ── Crawl ──────────────────────────────────────────────────
      const { pages, diagnostics } = await crawlSource(source);
      sourceReport.diagnostics = diagnostics;
      sourceReport.allUrls = pages.map(p => p.url);

      const toProcess = pages.slice(0, MAX_PAGES_PER_SOURCE);

      for (const { url, html, subsource } of toProcess) {
        try {
          const item = extractPage(html, url, source, subsource);

          if (!item.title || item.title.length < 3) { sourceReport.skippedNoTitle++; continue; }
          if (!item.category) { sourceReport.skippedNoCategory++; continue; }

          if (sourceReport.sampleItems.length < 5) {
            sourceReport.sampleItems.push({
              title:       item.title,
              url:         item.url,
              category:    item.category,
              subcategory: item.subcategory,
              price:       item.price,
              event_date:  item.event_date,
              area:        item.area,
              audience:    item.audience,
              summary:     item.summary?.slice(0, 120),
              fieldsPopulated: Object.entries(item).filter(([,v]) => v && (Array.isArray(v) ? v.length : true)).map(([k]) => k),
              fieldsMissing:   Object.entries(item).filter(([,v]) => !v || (Array.isArray(v) && !v.length)).map(([k]) => k),
            });
          }

          if (dryRun) { sourceReport.itemsExtracted++; continue; }

          const { error: ue } = await admin.from('trusted_items').upsert({
            source_id: sourceId, source_name: item.source_name,
            source_domain: item.source_domain, source_type: item.source_type,
            title: item.title, url: item.url,
            category: item.category, subcategory: item.subcategory,
            location: item.location, area: item.area, price: item.price,
            event_date: item.event_date, audience: item.audience,
            summary: item.summary, listing_type: 'standard',
            status: 'pending',             // all new items start as pending review
            is_external: true, is_monetized: false, city: item.city,
            crawled_at: new Date().toISOString(),
          }, { onConflict: 'url', ignoreDuplicates: false });

          if (ue?.code === '23505') { sourceReport.duplicatesSkipped++; }
          else if (ue) { sourceReport.extractionErrors.push(`Upsert ${url}: ${ue.message}`); }
          else { sourceReport.itemsExtracted++; }

        } catch (itemErr) {
          sourceReport.extractionErrors.push(`Extract ${url}: ${itemErr.message}`);
        }
      }

      // ── Save health metrics back to trusted_sources ─────────────
      if (!dryRun) {
        await admin.from('trusted_sources').update({
          last_crawl_at:     new Date().toISOString(),
          last_crawl_items:  sourceReport.itemsExtracted,
          last_crawl_errors: sourceReport.extractionErrors.length,
          last_crawl_skipped: sourceReport.skippedNoTitle + sourceReport.skippedNoCategory,
          last_crawl_pages:  diagnostics.pagesVisited,
        }).eq('id', sourceId);
      }

    } catch (err) {
      sourceReport.extractionErrors.push(`Source-level: ${err.message}`);
    }

    report.push(sourceReport);
  }

  // ── Summary ─────────────────────────────────────────────────────
  const totalExtracted = report.reduce((a, r) => a + r.itemsExtracted, 0);
  const totalPages     = report.reduce((a, r) => a + (r.diagnostics?.pagesVisited || 0), 0);
  const totalSkipped   = report.reduce((a, r) => a + (r.diagnostics?.pagesSkipped || 0), 0);
  const totalBlocked   = report.reduce((a, r) => a + (r.diagnostics?.blockedPathsHit?.length || 0), 0);
  const totalDupes     = report.reduce((a, r) => a + r.duplicatesSkipped, 0);
  const totalErrors    = report.reduce((a, r) => a + r.extractionErrors.length, 0);

  return NextResponse.json({
    success: true,
    dryRun,
    crawledAt: new Date().toISOString(),
    summary: {
      sourcesProcessed: report.length,
      totalPagesVisited: totalPages,
      totalPagesSkipped: totalSkipped,
      totalBlockedPaths: totalBlocked,
      totalItemsExtracted: totalExtracted,
      totalDuplicatesSkipped: totalDupes,
      totalExtractionErrors: totalErrors,
      extractionSuccessRate: totalPages > 0
        ? `${Math.round((totalExtracted / totalPages) * 100)}%`
        : 'n/a',
    },
    report,
  });
}

export async function GET(request) {
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ status: 'db-not-configured' });

  const { data: sources } = await admin.from('trusted_sources').select('source_name,domain,active,last_crawl_at,last_crawl_items,last_crawl_errors,last_crawl_pages');
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400 * 1000).toISOString();

  return NextResponse.json({
    status: 'ready',
    sources: (sources || []).map(s => ({
      name:       s.source_name,
      domain:     s.domain,
      active:     s.active,
      lastCrawl:  s.last_crawl_at,
      isStale:    !s.last_crawl_at || s.last_crawl_at < sevenDaysAgo,
      itemsLastCrawl: s.last_crawl_items,
      errorsLastCrawl: s.last_crawl_errors,
      pagesLastCrawl:  s.last_crawl_pages,
    })),
  });
}
