const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '..', 'analytics.db');

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
    CREATE TABLE IF NOT EXISTS visits (
      id          TEXT PRIMARY KEY,
      session_id  TEXT NOT NULL,
      ip          TEXT,
      page        TEXT,
      handle      TEXT,
      platform    TEXT,
      timestamp   INTEGER NOT NULL,
      date        TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      handle      TEXT NOT NULL,
      platform    TEXT NOT NULL,
      first_seen  INTEGER NOT NULL,
      last_seen   INTEGER NOT NULL,
      visit_count INTEGER DEFAULT 1,
      PRIMARY KEY (handle, platform)
    );

    CREATE TABLE IF NOT EXISTS daily_stats (
      date          TEXT PRIMARY KEY,
      total_visits  INTEGER DEFAULT 0,
      unique_users  INTEGER DEFAULT 0,
      cf_searches   INTEGER DEFAULT 0,
      lc_searches   INTEGER DEFAULT 0,
      roadmaps_gen  INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_visits_date     ON visits(date);
    CREATE INDEX IF NOT EXISTS idx_visits_session  ON visits(session_id);
    CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);
  `);
};

// ── Track a visit ──────────────────────────────────────────────────────────────
const trackVisit = (sessionId, ip, page, handle, platform) => {
  const db = getDB();
  const now = Date.now();
  const date = new Date().toISOString().split('T')[0];

  // Insert visit
  db.prepare(`
    INSERT INTO visits (id, session_id, ip, page, handle, platform, timestamp, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), sessionId, ip || 'unknown', page || '/', handle || null, platform || null, now, date);

  // Update user record
  if (handle && platform) {
    db.prepare(`
      INSERT INTO users (handle, platform, first_seen, last_seen, visit_count)
      VALUES (?, ?, ?, ?, 1)
      ON CONFLICT(handle, platform) DO UPDATE SET
        last_seen = excluded.last_seen,
        visit_count = visit_count + 1
    `).run(handle, platform, now, now);
  }

  // Update daily stats
  db.prepare(`
    INSERT INTO daily_stats (date, total_visits, unique_users, cf_searches, lc_searches, roadmaps_gen)
    VALUES (?, 1, 0, ?, ?, 0)
    ON CONFLICT(date) DO UPDATE SET
      total_visits = total_visits + 1,
      cf_searches  = cf_searches  + ?,
      lc_searches  = lc_searches  + ?
  `).run(
    date,
    platform === 'cf' ? 1 : 0,
    platform === 'lc' ? 1 : 0,
    platform === 'cf' ? 1 : 0,
    platform === 'lc' ? 1 : 0,
  );

  // Recalculate unique users for today
  const uniqueToday = db.prepare(`
    SELECT COUNT(DISTINCT handle) as cnt FROM visits
    WHERE date = ? AND handle IS NOT NULL
  `).get(date);
  db.prepare(`UPDATE daily_stats SET unique_users = ? WHERE date = ?`)
    .run(uniqueToday.cnt, date);
};

// ── Track roadmap generation ───────────────────────────────────────────────────
const trackRoadmap = () => {
  const db = getDB();
  const date = new Date().toISOString().split('T')[0];
  db.prepare(`
    INSERT INTO daily_stats (date, total_visits, unique_users, cf_searches, lc_searches, roadmaps_gen)
    VALUES (?, 0, 0, 0, 0, 1)
    ON CONFLICT(date) DO UPDATE SET roadmaps_gen = roadmaps_gen + 1
  `).run(date);
};

// ── Get analytics summary ──────────────────────────────────────────────────────
const getAnalytics = () => {
  const db = getDB();
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];
  const day7ago  = new Date(now - 7  * 86400000).toISOString().split('T')[0];
  const day30ago = new Date(now - 30 * 86400000).toISOString().split('T')[0];

  // Total users ever
  const totalUsers = db.prepare(`SELECT COUNT(*) as cnt FROM users`).get();

  // DAU (daily active users - today)
  const dau = db.prepare(`
    SELECT COUNT(DISTINCT handle) as cnt FROM visits
    WHERE date = ? AND handle IS NOT NULL
  `).get(today);

  // WAU (weekly active users)
  const wau = db.prepare(`
    SELECT COUNT(DISTINCT handle) as cnt FROM visits
    WHERE date >= ? AND handle IS NOT NULL
  `).get(day7ago);

  // MAU (monthly active users)
  const mau = db.prepare(`
    SELECT COUNT(DISTINCT handle) as cnt FROM visits
    WHERE date >= ? AND handle IS NOT NULL
  `).get(day30ago);

  // Total visits today
  const todayVisits = db.prepare(`SELECT total_visits FROM daily_stats WHERE date = ?`).get(today);

  // Total visits all time
  const totalVisits = db.prepare(`SELECT COUNT(*) as cnt FROM visits`).get();

  // Total roadmaps generated
  const totalRoadmaps = db.prepare(`SELECT SUM(roadmaps_gen) as cnt FROM daily_stats`).get();

  // Last 30 days chart data
  const dailyChart = db.prepare(`
    SELECT date, total_visits, unique_users, cf_searches, lc_searches, roadmaps_gen
    FROM daily_stats
    WHERE date >= ?
    ORDER BY date ASC
  `).all(day30ago);

  // Platform breakdown
  const platforms = db.prepare(`
    SELECT platform, COUNT(DISTINCT handle) as users
    FROM users WHERE platform IS NOT NULL
    GROUP BY platform
  `).all();

  // Most active users
  const topUsers = db.prepare(`
    SELECT handle, platform, visit_count, last_seen
    FROM users ORDER BY visit_count DESC LIMIT 10
  `).all();

  // Recent sessions (last 20 unique)
  const recentActivity = db.prepare(`
    SELECT DISTINCT handle, platform, MAX(timestamp) as last_seen
    FROM visits
    WHERE handle IS NOT NULL
    GROUP BY handle, platform
    ORDER BY last_seen DESC
    LIMIT 15
  `).all();

  // Hourly distribution today
  const hourlyToday = db.prepare(`
    SELECT strftime('%H', datetime(timestamp/1000, 'unixepoch')) as hour,
           COUNT(*) as visits
    FROM visits WHERE date = ?
    GROUP BY hour ORDER BY hour
  `).all(today);

  return {
    summary: {
      totalUsers:    totalUsers.cnt,
      dau:           dau.cnt,
      wau:           wau.cnt,
      mau:           mau.cnt,
      todayVisits:   todayVisits?.total_visits || 0,
      totalVisits:   totalVisits.cnt,
      totalRoadmaps: totalRoadmaps.cnt || 0,
    },
    dailyChart,
    platforms,
    topUsers: topUsers.map(u => ({
      ...u,
      last_seen: new Date(u.last_seen).toLocaleDateString('en-IN')
    })),
    recentActivity: recentActivity.map(u => ({
      ...u,
      last_seen: new Date(u.last_seen).toLocaleString('en-IN')
    })),
    hourlyToday,
  };
};

module.exports = { trackVisit, trackRoadmap, getAnalytics };
