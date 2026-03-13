// api/health.js — Lists available Gemini models for this API key
module.exports = async function handler(req, res) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(200).json({ error: 'No API key set' });

  // Try both v1 and v1beta
  const results = {};
  for (const ver of ['v1', 'v1beta']) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/${ver}/models?key=${key}`);
      const data = await r.json();
      results[ver] = (data.models || []).map(m => m.name).filter(n => n.includes('flash') || n.includes('pro'));
    } catch (e) {
      results[ver] = `error: ${e.message}`;
    }
  }
  res.status(200).json(results);
};
