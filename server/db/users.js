const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'users.db');

let db;

const getDB = () => {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initDB(db);
  }
  return db;
};

const initDB = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      google_id     TEXT UNIQUE NOT NULL,
      email         TEXT UNIQUE NOT NULL,
      name          TEXT NOT NULL,
      avatar        TEXT,
      cf_handle     TEXT,
      lc_handle     TEXT,
      created_at    INTEGER NOT NULL,
      last_login    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS roadmap_history (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL,
      platform      TEXT NOT NULL,
      handle        TEXT NOT NULL,
      duration      INTEGER NOT NULL,
      title         TEXT NOT NULL,
      summary       TEXT,
      target        TEXT,
      roadmap_json  TEXT NOT NULL,
      created_at    INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS roadmap_limits (
      user_id       TEXT NOT NULL,
      date          TEXT NOT NULL,
      count         INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, date)
    );

    CREATE INDEX IF NOT EXISTS idx_roadmap_history_user ON roadmap_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_roadmap_limits_user  ON roadmap_limits(user_id, date);
  `);
};

// ── Upsert user from Google OAuth ─────────────────────────────────────────────
const upsertUser = (googleId, email, name, avatar) => {
  const db = getDB();
  const now = Date.now();
  const existing = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);

  if (existing) {
    db.prepare(`
      UPDATE users SET name=?, avatar=?, email=?, last_login=? WHERE google_id=?
    `).run(name, avatar, email, now, googleId);
    return db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);
  } else {
    const id = require('crypto').randomUUID();
    db.prepare(`
      INSERT INTO users (id, google_id, email, name, avatar, created_at, last_login)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, googleId, email, name, avatar, now, now);
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }
};

// ── Update handles ─────────────────────────────────────────────────────────────
const updateHandles = (userId, cfHandle, lcHandle) => {
  const db = getDB();
  db.prepare(`
    UPDATE users SET cf_handle=?, lc_handle=? WHERE id=?
  `).run(cfHandle || null, lcHandle || null, userId);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
};

// ── Get user by id ─────────────────────────────────────────────────────────────
const getUserById = (id) => {
  return getDB().prepare('SELECT * FROM users WHERE id = ?').get(id);
};

// ── Roadmap limit check (2 per day) ───────────────────────────────────────────
const checkRoadmapLimit = (userId) => {
  const db = getDB();
  const date = new Date().toISOString().split('T')[0];
  const row = db.prepare('SELECT count FROM roadmap_limits WHERE user_id=? AND date=?').get(userId, date);
  return { count: row?.count || 0, limit: 2, remaining: 2 - (row?.count || 0) };
};

const incrementRoadmapCount = (userId) => {
  const db = getDB();
  const date = new Date().toISOString().split('T')[0];
  db.prepare(`
    INSERT INTO roadmap_limits (user_id, date, count) VALUES (?, ?, 1)
    ON CONFLICT(user_id, date) DO UPDATE SET count = count + 1
  `).run(userId, date);
};

// ── Save roadmap to history ────────────────────────────────────────────────────
const saveRoadmap = (userId, platform, handle, duration, title, summary, target, roadmapJson) => {
  const db = getDB();
  const id = require('crypto').randomUUID();
  db.prepare(`
    INSERT INTO roadmap_history (id, user_id, platform, handle, duration, title, summary, target, roadmap_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, platform, handle, duration, title, summary, String(target), JSON.stringify(roadmapJson), Date.now());
  return id;
};

// ── Get roadmap history for user ──────────────────────────────────────────────
const getRoadmapHistory = (userId) => {
  const db = getDB();
  return db.prepare(`
    SELECT id, platform, handle, duration, title, summary, target, created_at
    FROM roadmap_history WHERE user_id=? ORDER BY created_at DESC LIMIT 20
  `).all(userId);
};

// ── Get single roadmap ─────────────────────────────────────────────────────────
const getRoadmapById = (id, userId) => {
  const db = getDB();
  const row = db.prepare('SELECT * FROM roadmap_history WHERE id=? AND user_id=?').get(id, userId);
  if (!row) return null;
  return { ...row, roadmap_json: JSON.parse(row.roadmap_json) };
};

// ── Delete roadmap ─────────────────────────────────────────────────────────────
const deleteRoadmap = (id, userId) => {
  getDB().prepare('DELETE FROM roadmap_history WHERE id=? AND user_id=?').run(id, userId);
};

module.exports = {
  upsertUser, updateHandles, getUserById,
  checkRoadmapLimit, incrementRoadmapCount,
  saveRoadmap, getRoadmapHistory, getRoadmapById, deleteRoadmap
};
