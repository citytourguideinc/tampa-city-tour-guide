// lib/crawler.js — v3 with robots.txt compliance
// Domain-restricted BFS crawler. Returns crawled pages AND a full diagnostics report.
const DEFAULT_TIMEOUT = 8000;
const USER_AGENT = 'CityTourGuideBot/1.0 (+https://tampa.citytourguide.app/about)';
const BOT_NAME   = 'citytourguidebot'; // lowercase for robots.txt matching

/**
 * Check robots.txt for a domain before crawling.
 * Returns { allowed: boolean, disallowedPaths: string[], crawlDelay: number|null }
 */
export async function checkRobotsTxt(domain) {
  const url = `https://${domain}/robots.txt`;
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return { allowed: true, disallowedPaths: [], crawlDelay: null };
    const text = await res.text();
    return parseRobotsTxt(text);
  } catch {
    return { allowed: true, disallowedPaths: [], crawlDelay: null }; // Can't fetch = assume allowed
  }
}

function parseRobotsTxt(text) {
  const lines = text.split('\n').map(l => l.trim());
  let active = false; // true when we're in a relevant User-agent block
  let disallowedPaths = [];
  let crawlDelay = null;

  for (const line of lines) {
    if (line.startsWith('#') || !line) continue;
    const [key, ...rest] = line.split(':');
    const val = rest.join(':').trim();
    const k = key.toLowerCase().trim();

    if (k === 'user-agent') {
      const agent = val.toLowerCase();
      active = agent === '*' || agent.includes(BOT_NAME);
    } else if (active && k === 'disallow' && val) {
      if (val === '/') return { allowed: false, disallowedPaths: ['/'], crawlDelay }; // Full block
      disallowedPaths.push(val);
    } else if (active && k === 'crawl-delay') {
      crawlDelay = parseInt(val, 10) || null;
    }
  }

  return { allowed: true, disallowedPaths, crawlDelay };
}

/**
 * Crawl a single trusted source.
 * Returns:
 *   pages:          Array<{url, html, subsource}>
 *   diagnostics:    { pagesVisited, pagesSkipped, blockedPathsHit, fetchErrors, totalLinksFound, durationMs }
 *   robotsBlocked:  boolean — true if robots.txt blocked us
 *   robotsInfo:     { allowed, disallowedPaths, crawlDelay }
 */
export async function crawlSource(source) {
  const {
    mainUrl, domain, allowedDepth = 2,
    blockedPaths = [], subsources = [], allowedPaths = null,
  } = source;

  // ── Robots.txt compliance check ──────────────────────────────
  const robotsInfo = await checkRobotsTxt(domain);
  if (!robotsInfo.allowed) {
    console.log(`[crawler] robots.txt BLOCKED: ${domain}`);
    return {
      pages: [], robotsBlocked: true, robotsInfo,
      diagnostics: { pagesVisited: 0, pagesSkipped: 0, blockedPathsHit: [], fetchErrors: [], totalLinksFound: 0, durationMs: 0 },
    };
  }
  // Merge robots.txt disallowed paths with our own blockedPaths
  const allBlockedPaths = [...blockedPaths, ...robotsInfo.disallowedPaths];
  const crawlDelay = robotsInfo.crawlDelay ? robotsInfo.crawlDelay * 1000 : 0;

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
    const blockReason = getBlockReason(norm, domain, allBlockedPaths, allowedPaths);
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
