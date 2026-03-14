// api/chat.js — Vercel Serverless Function
// Receives a user query, sends it to Gemini with the curated DB as context,
// returns a conversational reply + matched link objects.
// Supports multiple cities — detects city from request hostname.

// ── City config registry ───────────────────────────────────────
const CITY_CONFIGS = {
  tampa:  require('../cities/tampa'),
  miami:  require('../cities/miami'),
  // Add more cities here: orlando: require('../cities/orlando'),
};

function getCityConfig(hostname) {
  const host = (hostname || '').toLowerCase();
  for (const cityKey of Object.keys(CITY_CONFIGS)) {
    if (host.includes(cityKey)) return CITY_CONFIGS[cityKey];
  }
  return CITY_CONFIGS.tampa; // default
}

// ── Affiliate & featured vendor config (from Vercel env vars) ──
function enhanceLinks(links) {
  const gygId   = process.env.GETYOURGUIDE_PARTNER_ID;  // sign up: partner.getyourguide.com
  const viatorId = process.env.VIATOR_AFFILIATE_ID;       // sign up: partnerresources.viator.com
  const featuredName = process.env.FEATURED_VENDOR_NAME;
  const featuredUrl  = process.env.FEATURED_VENDOR_URL;
  const featuredSub  = process.env.FEATURED_VENDOR_SUB || 'Featured Partner';
  const featuredIcon = process.env.FEATURED_VENDOR_ICON || '⭐';

  const enhanced = links.map(link => {
    let url = link.url;
    if (gygId && url.includes('getyourguide.com')) {
      url = url + (url.includes('?') ? '&' : '?') + `partner_id=${gygId}`;
    }
    if (viatorId && url.includes('viator.com')) {
      url = url + (url.includes('?') ? '&' : '?') + `mcid=${viatorId}&pid=P00`;
    }
    return { ...link, url };
  });

  // Inject featured vendor as first card if configured
  if (featuredName && featuredUrl) {
    enhanced.unshift({
      name: featuredName,
      url:  featuredUrl,
      sub:  featuredSub,
      icon: featuredIcon,
      featured: true,
    });
  }
  return enhanced;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body || {};
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Missing query' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // Load city config based on hostname (tampa.citytourguide.app → Tampa, etc.)
  const cityConfig = getCityConfig(req.headers.host);
  const DB = cityConfig.db;
  const DB_CONTEXT = DB.map((d, i) =>
    `[${i}] ${d.name} (${d.cat} › ${d.sub}) — keywords: ${d.kw}`
  ).join('\n');

  if (!apiKey) {
    return res.status(200).json({ reply: null, links: enhanceLinks(fallbackSearch(query, DB)) });
  }

  const prompt = `${cityConfig.aiContext}
A visitor asked: "${query.trim()}"

Below is your curated database of ${cityConfig.city} resources (index: name, category, subcategory, keywords):
${DB_CONTEXT}

Your task:
1. Write a short, warm, 1-2 sentence conversational reply that acknowledges what they're looking for.
2. Select the most relevant resource indices (max 8) from the database above.

Respond ONLY with valid JSON in this exact format (no markdown, no code block):
{"reply":"Your conversational sentence here.","indices":[0,1,2]}`;

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

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      throw new Error(`Gemini ${geminiRes.status}: ${errBody}`);
    }

    const data = await geminiRes.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extract the JSON object robustly regardless of surrounding text or markdown
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`No JSON found in Gemini response: ${raw.slice(0, 200)}`);
    const parsed = JSON.parse(jsonMatch[0]);

    const links = (parsed.indices || [])
      .filter(i => i >= 0 && i < DB.length)
      .map(i => ({ name: DB[i].name, url: DB[i].url, sub: DB[i].sub, icon: DB[i].icon }));

    return res.status(200).json({ reply: parsed.reply || null, links: enhanceLinks(links) });
  } catch (err) {
    console.error('Gemini API error:', err.message);
    // Graceful fallback to keyword search
    return res.status(200).json({ reply: null, links: enhanceLinks(fallbackSearch(query, DB)) });
  }
}

function fallbackSearch(query, DB) {
  if (!DB || !DB.length) return [];
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return DB.map(item => {
    let score = 0;
    terms.forEach(t => {
      if (item.name.toLowerCase().includes(t)) score += 4;
      if (item.sub.toLowerCase().includes(t))  score += 3;
      if (item.kw.includes(t))                 score += 2;
    });
    return { item, score };
  })
  .filter(x => x.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 8)
  .map(x => ({ name: x.item.name, url: x.item.url, sub: x.item.sub, icon: x.item.icon }));
}
