// lib/crawler.js
// Domain-restricted BFS web crawler — server-side only, no npm deps
// Crawls only within approved domains up to allowedDepth levels.

const DEFAULT_TIMEOUT = 8000; // 8s per page
const USER_AGENT = 'CityTourGuideBot/1.0 (+https://tampa.citytourguide.app)';

/**
 * Crawl a single trusted source.
 * @param {object} source — entry from trusted-sources.json
 * @returns {Promise<Array<{url, html, subsource}>>}
 */
export async function crawlSource(source) {
  const {
    mainUrl, domain, allowedDepth = 2,
    blockedPaths = [], subsources = [], allowedPaths = null,
  } = source;

  const visited   = new Set();
  const results   = [];

  // Queue entries: { url, depth, subsource }
  const queue = [{ url: mainUrl, depth: 0, subsource: null }];

  // Add subsource starting URLs
  for (const sub of subsources) {
    if (sub.url) queue.push({ url: sub.url, depth: 0, subsource: sub });
  }

  while (queue.length > 0) {
    const { url, depth, subsource } = queue.shift();
    const normalised = normaliseUrl(url);
    if (!normalised) continue;
    if (visited.has(normalised)) continue;
    if (!isAllowed(normalised, domain, blockedPaths, allowedPaths)) continue;
    visited.add(normalised);

    const html = await fetchPage(normalised);
    if (!html) continue;

    results.push({ url: normalised, html, subsource });

    // Only follow links if we haven't hit depth limit
    if (depth < allowedDepth) {
      const links = extractLinks(html, normalised, domain);
      for (const link of links) {
        if (!visited.has(link) && isAllowed(link, domain, blockedPaths, allowedPaths)) {
          // Inherit subsource from parent if the link lives under the subsource path
          const matchedSub = findSubsource(link, subsources) || subsource;
          queue.push({ url: link, depth: depth + 1, subsource: matchedSub });
        }
      }
    }
  }

  return results;
}

// ── URL helpers ────────────────────────────────────────────────────────────
function normaliseUrl(raw) {
  try {
    const u = new URL(raw);
    u.hash = '';
    // Remove common session / tracking params
    ['utm_source','utm_medium','utm_campaign','sid','sessionid'].forEach(p => u.searchParams.delete(p));
    return u.href;
  } catch { return null; }
}

function isAllowed(url, domain, blockedPaths, allowedPaths) {
  try {
    const u = new URL(url);
    // Must stay on approved domain
    if (!u.hostname.endsWith(domain)) return false;
    // Must not match any blocked path
    if (blockedPaths.some(p => u.pathname.startsWith(p))) return false;
    // If allowedPaths is set, must match at least one
    if (allowedPaths && !allowedPaths.some(p => u.pathname.startsWith(p))) return false;
    // Skip file downloads
    if (/\.(pdf|zip|docx?|xlsx?|png|jpe?g|gif|svg|mp4|mp3|css|js)$/i.test(u.pathname)) return false;
    return true;
  } catch { return false; }
}

function extractLinks(html, baseUrl, domain) {
  const links = [];
  const regex = /href=["']([^"'#?][^"']*?)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const abs = new URL(match[1], baseUrl).href;
      const u   = new URL(abs);
      if (u.hostname.endsWith(domain)) links.push(abs);
    } catch { /* skip invalid */ }
  }
  return [...new Set(links)];
}

function findSubsource(url, subsources) {
  return subsources.find(s => url.startsWith(s.url)) || null;
}

// ── Fetch ──────────────────────────────────────────────────────────────────
async function fetchPage(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return null;
    return await res.text();
  } catch (err) {
    console.warn(`[crawler] Failed to fetch ${url}: ${err.message}`);
    return null;
  }
}
