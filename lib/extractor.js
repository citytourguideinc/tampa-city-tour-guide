// lib/extractor.js
// Pure-JS HTML field extractor — no npm deps, works in Next.js edge/server
// Extracts structured metadata from raw HTML for a crawled page.

/** @param {string} html  @param {string} url  @param {object} sourceConfig  @param {object} subsource */
export function extractPage(html, url, sourceConfig, subsource = null) {
  const title     = extractTitle(html);
  const summary   = extractSummary(html);
  const price     = extractPrice(html, subsource);
  const eventDate = extractDate(html);
  const location  = extractLocation(html);
  const audience  = extractAudience(html, title, summary);
  const { category, subcategory } = classifyPage(url, html, subsource);

  return {
    title,
    url,
    source_name:   sourceConfig.sourceName,
    source_domain: sourceConfig.domain,
    source_type:   sourceConfig.sourceType,
    category,
    subcategory,
    location,
    area:          subsource?.area || sourceConfig.area || 'Downtown',
    price,
    event_date:    eventDate,
    audience,
    summary,
    listing_type:  'standard',
    is_external:   true,
    is_monetized:  false,
    city:          sourceConfig.city || 'Tampa',
  };
}

// ── Title ─────────────────────────────────────────────────────────────────
function extractTitle(html) {
  // Try og:title first, then <title>, then first h1
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
          || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  if (og) return cleanText(og[1]);

  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleTag) return cleanText(titleTag[1].split('|')[0].split('–')[0]);

  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  return h1 ? cleanText(h1[1]) : null;
}

// ── Summary ───────────────────────────────────────────────────────────────
function extractSummary(html) {
  // og:description or meta description
  const og = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{10,}?)["']/i)
          || html.match(/<meta[^>]+content=["']([^"']{10,}?)["'][^>]+property=["']og:description["']/i);
  if (og) return cleanText(og[1]).slice(0, 280);

  const desc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{10,}?)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']{10,}?)["'][^>]+name=["']description["']/i);
  if (desc) return cleanText(desc[1]).slice(0, 280);

  // First meaningful paragraph
  const paras = html.match(/<p[^>]*>([^<]{30,})<\/p>/gi) || [];
  for (const p of paras) {
    const text = stripTags(p).trim();
    if (text.length > 30 && !text.match(/cookie|privacy|login/i)) return text.slice(0, 280);
  }
  return null;
}

// ── Price ─────────────────────────────────────────────────────────────────
function extractPrice(html, subsource) {
  if (subsource?.priceHint) return subsource.priceHint;
  const text = stripTags(html);
  if (/\bfree\b/i.test(text)) return 'Free';
  const dollarMatch = text.match(/\$\s*(\d+)(?:\s*[-–—]\s*\$?\s*(\d+))?/);
  if (dollarMatch) {
    const lo = dollarMatch[1];
    const hi = dollarMatch[2];
    return hi ? `$${lo}–$${hi}` : `$${lo}`;
  }
  return null;
}

// ── Date ──────────────────────────────────────────────────────────────────
function extractDate(html) {
  // ISO date in content or JSON-LD
  const iso = html.match(/\b(202\d-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01]))\b/);
  if (iso) return iso[1];

  // Human format: "March 14, 2026"
  const months = 'Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?';
  const human  = html.match(new RegExp(`(${months})\\s+(\\d{1,2}),?\\s+(202\\d)`, 'i'));
  if (human) {
    const d = new Date(`${human[1]} ${human[2]}, ${human[3]}`);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
  }
  return null;
}

// ── Location ──────────────────────────────────────────────────────────────
function extractLocation(html) {
  const text = stripTags(html);
  // Look for "at <venue>, Tampa" pattern or address-like strings
  const at = text.match(/(?:at|@)\s+([A-Z][^,.]{3,40}),?\s+(?:Tampa|Downtown)/i);
  if (at) return at[1].trim();
  const addr = text.match(/\d+\s+[A-Z][a-z]+\s+(?:St|Ave|Blvd|Dr|Rd|Way|Ln|Pl)\b/i);
  if (addr) return addr[0];
  return null;
}

// ── Audience ──────────────────────────────────────────────────────────────
const AUDIENCE_PATTERNS = [
  [/\bfamily\b|\bkids?\b|\bchildren\b/i,    'family'],
  [/\bnightlife\b|\bbar\b|\bcocktail\b/i,   'nightlife'],
  [/\bcouples?\b|\bromantic\b|\bdate\b/i,   'couples'],
  [/\boutdoor\b|\bpark\b|\btrail\b/i,       'outdoor'],
  [/\bart\b|\bmuseum\b|\bculture\b/i,       'arts'],
  [/\bvolunteer\b|\bcommunity\b/i,          'community'],
];

function extractAudience(html, title, summary) {
  const text = ((title || '') + ' ' + (summary || '') + ' ' + stripTags(html).slice(0, 2000)).toLowerCase();
  return AUDIENCE_PATTERNS.filter(([rx]) => rx.test(text)).map(([, tag]) => tag);
}

// ── Category Classifier ───────────────────────────────────────────────────
const CATEGORY_MAP = [
  [/\/events?\//i,               'Events',           'Downtown Events'],
  [/\/free-events?\//i,          'Events',           'Free Events'],
  [/\/community-events?\//i,     'Events',           'Community Events'],
  [/\/neighborhood/i,            'Tours & Activities','Neighborhoods'],
  [/\/dining|\/restaurants?\//i, 'Food',             'Restaurants'],
  [/\/shop|\/retail/i,           'Shopping',         'Retail'],
  [/\/news\//i,                  null,               null],  // skip news pages
];

function classifyPage(url, html, subsource) {
  // Prefer subsource classification if available
  if (subsource?.category) return { category: subsource.category, subcategory: subsource.subcategory };

  for (const [rx, cat, sub] of CATEGORY_MAP) {
    if (rx.test(url)) return { category: cat, subcategory: sub };
  }

  // Fallback: classify from title/description keywords
  const text = stripTags(html).slice(0, 1000).toLowerCase();
  if (/free|no cost/i.test(text)) return { category: 'Events', subcategory: 'Free Events' };
  if (/event|festival|concert|show/i.test(text)) return { category: 'Events', subcategory: 'Downtown Events' };
  if (/restaurant|dining|food|eat/i.test(text)) return { category: 'Food', subcategory: 'Dining' };
  if (/tour|walk|explore/i.test(text)) return { category: 'Tours & Activities', subcategory: 'City Tours' };

  return { category: 'Discovery', subcategory: 'General' };
}

// ── Helpers ───────────────────────────────────────────────────────────────
function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

function cleanText(str) {
  return str.replace(/\s+/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
            .replace(/&#\d+;/g, '').replace(/&[a-z]+;/g, '').trim();
}
