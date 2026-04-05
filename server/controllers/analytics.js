const { trackVisit, trackRoadmap, getAnalytics } = require('../analytics/db');

// POST /api/analytics/visit
const recordVisit = (req, res) => {
  try {
    const { sessionId, page, handle, platform } = req.body;
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
    trackVisit(sessionId, ip, page, handle, platform);
    res.json({ ok: true });
  } catch (err) {
    console.error('Analytics visit error:', err.message);
    res.json({ ok: false }); // Never fail silently — don't block main app
  }
};

// POST /api/analytics/roadmap
const recordRoadmap = (req, res) => {
  try {
    trackRoadmap();
    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false });
  }
};

// GET /api/analytics/dashboard
const getDashboard = (req, res) => {
  try {
    // Simple password protection — set ANALYTICS_PASSWORD in .env
    const password = req.query.password;
    const expected = process.env.ANALYTICS_PASSWORD;
    if (expected && password !== expected) {
      return res.status(401).json({ error: 'Unauthorized. Pass ?password=yourpassword' });
    }
    const data = getAnalytics();
    res.json(data);
  } catch (err) {
    console.error('Analytics dashboard error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { recordVisit, recordRoadmap, getDashboard };
