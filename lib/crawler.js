// lib/crawler.js — v2 with diagnostics
// Domain-restricted BFS crawler. Returns crawled pages AND a full diagnostics report.
const DEFAULT_TIMEOUT = 8000;
const USER_AGENT = 'CityTourGuideBot/1.0 (+https://tampa.citytourguide.app/about)';

/**
 * Crawl a single trusted source.
 * Returns:
 *   pages:       Array<{url, html, subsource}>
 *   diagnostics: { pagesVisited, pagesSkipped, blockedPathsHit, fetchErrors, totalLinksFound, durationMs }
 */
export async function crawlSource(source) {
  const {
    mainUrl, domain, allowedDepth = 2,
    blockedPaths = [], subsources = [], allowedPaths = null,
  } = source;

  const visited    = new Set();
  const blocked    = new Set(); // paths that were blocked
  const pages      = [];
  const diagnostics = {
    pagesVisited: 0,
    pagesSkipped: 0,
    blockedPathsHit: [],
    fetchErrors: [],
    totalLinksFound: 0,
    startedAt: new Date().toISOString(),
    durationMs: 0,
  };
  const t0 = Date.now();

  // Seed queue with main URL + subsource URLs
  const queue = [{ url: mainUrl, depth: 0, subsource: null }];
  for (const sub of subsources) {
    if (sub.url) queue.push({ url: sub.url, depth: 0, subsource: sub });
  }

  while (queue.length > 0) {
    const { url, depth, subsource } = queue.shift();
    const norm = normaliseUrl(url);
    if (!norm) { diagnostics.pagesSkipped++; continue; }
    if (visited.has(norm)) { diagnostics.pagesSkipped++; continue; }

    // Check allowed domain + blocked paths
    const blockReason = getBlockReason(norm, domain, blockedPaths, allowedPaths);
    if (blockReason) {
      diagnostics.pagesSkipped++;
      if (!blocked.has(norm)) {
        blocked.add(norm);
        diagnostics.blockedPathsHit.push({ url: norm, reason: blockReason });
      }
      continue;
    }

    visited.add(norm);
    const html = await fetchPage(norm);

    if (!html) {
      diagnostics.fetchErrors.push(norm);
      diagnostics.pagesSkipped++;
      continue;
    }

    pages.push({ url: norm, html, subsource });
    diagnostics.pagesVisited++;

    if (depth < allowedDepth) {
      const links = extractLinks(html, norm, domain);
      diagnostics.totalLinksFound += links.length;
      for (const link of links) {
        if (!visited.has(link)) {
          const sub2 = findSubsource(link, subsources) || subsource;
          queue.push({ url: link, depth: depth + 1, subsource: sub2 });
        }
      }
    }
  }

  diagnostics.durationMs = Date.now() - t0;
  return { pages, diagnostics };
}

// ── Helpers ────────────────────────────────────────────────────────────────
function normaliseUrl(raw) {
  try {
    const u = new URL(raw);
    u.hash = '';
    ['utm_source','utm_medium','utm_campaign','sid','sessionid'].forEach(p => u.searchParams.delete(p));
    return u.href;
  } catch { return null; }
}

function getBlockReason(url, domain, blockedPaths, allowedPaths) {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith(domain))           return 'external-domain';
    if (blockedPaths.some(p => u.pathname.startsWith(p))) return 'blocked-path';
    if (allowedPaths && !allowedPaths.some(p => u.pathname.startsWith(p))) return 'not-in-allowed-paths';
    if (/\.(pdf|zip|docx?|xlsx?|png|jpe?g|gif|svg|mp4|mp3|css|js)$/i.test(u.pathname)) return 'binary-file';
    return null;
  } catch { return 'invalid-url'; }
}

function extractLinks(html, baseUrl, domain) {
  const links = [];
  const regex = /href=["']([^"'#?][^"']*?)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const abs = new URL(match[1], baseUrl).href;
      if (new URL(abs).hostname.endsWith(domain)) links.push(abs);
    } catch { /* skip */ }
  }
  return [...new Set(links)];
}

function findSubsource(url, subsources) {
  return subsources.find(s => url.startsWith(s.url)) || null;
}

async function fetchPage(url) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), DEFAULT_TIMEOUT);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html', 'Accept-Language': 'en-US,en;q=0.9' },
      redirect: 'follow',
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return null;
    return await res.text();
  } catch (err) {
    console.warn(`[crawler] ${url}: ${err.message}`);
    return null;
  }
}
