// api/health.js — Status check
module.exports = function handler(req, res) {
  res.status(200).json({ status: 'ok', hasApiKey: !!process.env.GEMINI_API_KEY });
};

