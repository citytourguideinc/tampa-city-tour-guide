// api/health.js — Temporary diagnostic endpoint
module.exports = function handler(req, res) {
  const hasKey = !!process.env.GEMINI_API_KEY;
  const keyPreview = hasKey
    ? process.env.GEMINI_API_KEY.slice(0, 6) + '...'
    : 'NOT SET';
  res.status(200).json({ hasKey, keyPreview });
};
