const axios = require('axios');
const cache = require('../cache/cache');

const CF_BASE = 'https://codeforces.com/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cfGet = async (endpoint, cacheKey, ttl = 300) => {
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const res = await axios.get(`${CF_BASE}/${endpoint}`);
  if (res.data.status !== 'OK') throw new Error(res.data.comment || 'Codeforces API error');
  cache.set(cacheKey, res.data.result, ttl);
  return res.data.result;
};

// ─── Main Controller ───────────────────────────────────────────────────────────

const getStats = async (req, res) => {
  try {
    const { handle } = req.params;

    const [userInfoArr, submissions, ratingHistory] = await Promise.all([
      cfGet(`user.info?handles=${handle}`, `userinfo_${handle}`),
      cfGet(`user.status?handle=${handle}&from=1&count=10000`, `submissions_${handle}`),
      cfGet(`user.rating?handle=${handle}`, `rating_${handle}`)
    ]);

    const userInfo = userInfoArr[0];

    // ── Deduplicate solved problems (AC only) ──────────────────────────────────
    const solvedMap = new Map();
    submissions.forEach(sub => {
      if (sub.verdict === 'OK' && sub.problem) {
        const key = `${sub.problem.contestId}-${sub.problem.index}`;
        if (!solvedMap.has(key)) {
          solvedMap.set(key, sub.problem);
        }
      }
    });

    // ── Tag frequency ──────────────────────────────────────────────────────────
    const tagCount = {};
    solvedMap.forEach(problem => {
      (problem.tags || []).forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    const tagAnalysis = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));

    // ── Rating history ─────────────────────────────────────────────────────────
    const ratingData = ratingHistory.map(c => ({
      contestName: c.contestName,
      date: new Date(c.ratingUpdateTimeSeconds * 1000).toLocaleDateString('en-IN'),
      newRating: c.newRating,
      oldRating: c.oldRating,
      change: c.newRating - c.oldRating,
      rank: c.rank
    }));

    // ── Difficulty breakdown ───────────────────────────────────────────────────
    const difficultyBuckets = {};
    solvedMap.forEach(p => {
      if (p.rating) {
        const bucket = `${Math.floor(p.rating / 200) * 200}`;
        difficultyBuckets[bucket] = (difficultyBuckets[bucket] || 0) + 1;
      }
    });
    const difficultyData = Object.entries(difficultyBuckets)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([rating, count]) => ({ rating: Number(rating), count }));

    res.json({
      userInfo: {
        handle: userInfo.handle,
        rating: userInfo.rating || 0,
        maxRating: userInfo.maxRating || 0,
        rank: userInfo.rank || 'unrated',
        maxRank: userInfo.maxRank || 'unrated',
        avatar: userInfo.titlePhoto || userInfo.avatar,
        country: userInfo.country || null,
        organization: userInfo.organization || null,
        contribution: userInfo.contribution || 0,
        friendOfCount: userInfo.friendOfCount || 0,
        registrationTime: new Date(userInfo.registrationTimeSeconds * 1000).getFullYear()
      },
      totalSolved: solvedMap.size,
      totalSubmissions: submissions.length,
      tagAnalysis,
      difficultyData,
      ratingHistory: ratingData
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getStats };
