const jwt = require('jsonwebtoken');
const { getUserById } = require('../db/users');

const JWT_SECRET = process.env.JWT_SECRET || 'cp-tracker-secret-change-in-prod';

// ── Generate token ─────────────────────────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
};

// ── Verify token middleware ────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = getUserById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ── Optional auth — attaches user if token present but doesn't block ──────────
const optionalAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    try {
      const token = auth.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = getUserById(decoded.userId);
    } catch (e) {}
  }
  next();
};

module.exports = { generateToken, requireAuth, optionalAuth };
