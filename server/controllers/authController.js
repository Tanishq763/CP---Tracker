const axios = require('axios');
const { generateToken } = require('../middleware/auth');
const {
  upsertUser, updateHandles, getUserById,
  checkRoadmapLimit, saveRoadmap, getRoadmapHistory,
  getRoadmapById, deleteRoadmap
} = require('../db/users');

// ── Google OAuth Login ─────────────────────────────────────────────────────────
// Frontend sends Google access token, we verify it with Google and get user info
const googleLogin = async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ error: 'No access token provided' });

    // Verify token with Google and get user info
    const googleRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const { sub: googleId, email, name, picture } = googleRes.data;
    if (!googleId || !email) return res.status(400).json({ error: 'Invalid Google token' });

    // Upsert user in DB
    const user = upsertUser(googleId, email, name, picture);

    // Generate JWT
    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        cfHandle: user.cf_handle,
        lcHandle: user.lc_handle,
        createdAt: user.created_at,
      }
    });
  } catch (err) {
    console.error('Google login error:', err.message);
    res.status(500).json({ error: 'Failed to authenticate with Google' });
  }
};

// ── Get current user ───────────────────────────────────────────────────────────
const getMe = (req, res) => {
  const user = req.user;
  const limit = checkRoadmapLimit(user.id);
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    cfHandle: user.cf_handle,
    lcHandle: user.lc_handle,
    createdAt: user.created_at,
    roadmapLimit: limit,
  });
};

// ── Update handles ─────────────────────────────────────────────────────────────
const updateUserHandles = (req, res) => {
  try {
    const { cfHandle, lcHandle } = req.body;
    const updated = updateHandles(req.user.id, cfHandle?.trim(), lcHandle?.trim());
    res.json({
      cfHandle: updated.cf_handle,
      lcHandle: updated.lc_handle,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Save roadmap to history ────────────────────────────────────────────────────
const saveRoadmapToHistory = (req, res) => {
  try {
    const { platform, handle, duration, title, summary, target, roadmap } = req.body;
    if (!platform || !handle || !roadmap) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const id = saveRoadmap(
      req.user.id, platform, handle, duration,
      title || `${duration}-Day Roadmap`, summary, target, roadmap
    );
    res.json({ id, saved: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Get roadmap history ────────────────────────────────────────────────────────
const getHistory = (req, res) => {
  try {
    const history = getRoadmapHistory(req.user.id);
    res.json(history.map(r => ({
      ...r,
      createdAt: new Date(r.created_at).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      })
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Get single roadmap ─────────────────────────────────────────────────────────
const getSingleRoadmap = (req, res) => {
  try {
    const roadmap = getRoadmapById(req.params.id, req.user.id);
    if (!roadmap) return res.status(404).json({ error: 'Roadmap not found' });
    res.json(roadmap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Delete roadmap ─────────────────────────────────────────────────────────────
const deleteRoadmapEntry = (req, res) => {
  try {
    deleteRoadmap(req.params.id, req.user.id);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Check roadmap limit ────────────────────────────────────────────────────────
const getRoadmapLimit = (req, res) => {
  const limit = checkRoadmapLimit(req.user.id);
  res.json(limit);
};

module.exports = {
  googleLogin, getMe, updateUserHandles,
  saveRoadmapToHistory, getHistory, getSingleRoadmap,
  deleteRoadmapEntry, getRoadmapLimit
};
