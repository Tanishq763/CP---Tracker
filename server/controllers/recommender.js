const axios = require('axios');
const cache = require('../cache/cache');

const CF_BASE = 'https://codeforces.com/api';

const getRecommendations = async (req, res) => {
  try {
    const { handle } = req.params;

    // ── Fetch user info + submissions in parallel ──────────────────────────────
    const [userInfoRes, subRes] = await Promise.all([
      axios.get(`${CF_BASE}/user.info?handles=${handle}`),
      axios.get(`${CF_BASE}/user.status?handle=${handle}&from=1&count=10000`)
    ]);

    if (userInfoRes.data.status !== 'OK') throw new Error('User not found');
    if (subRes.data.status !== 'OK') throw new Error('Failed to fetch submissions');

    const userRating = userInfoRes.data.result[0].rating || 1200;
    const submissions = subRes.data.result;

    // ── Build solved set + tag frequency ──────────────────────────────────────
    const solvedSet = new Set();
    const tagCount = {};
    const totalAttempts = {};

    submissions.forEach(sub => {
      if (!sub.problem) return;
      const key = `${sub.problem.contestId}-${sub.problem.index}`;

      (sub.problem.tags || []).forEach(tag => {
        totalAttempts[tag] = (totalAttempts[tag] || 0) + 1;
      });

      if (sub.verdict === 'OK') {
        solvedSet.add(key);
        (sub.problem.tags || []).forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }
    });

    // ── Compute weak score per tag: fewer solves = weaker ─────────────────────
    const allTags = new Set([...Object.keys(tagCount), ...Object.keys(totalAttempts)]);
    const tagScores = [];
    allTags.forEach(tag => {
      const solved = tagCount[tag] || 0;
      const attempted = totalAttempts[tag] || 0;
      tagScores.push({ tag, solved, attempted, ratio: attempted > 0 ? solved / attempted : 0 });
    });

    // Weak = low solve count (exclude tags with 0 attempts as well as *special* tags)
    const excludeTags = new Set(['*special']);
    const weakTags = tagScores
      .filter(t => t.attempted > 0 && !excludeTags.has(t.tag))
      .sort((a, b) => a.solved - b.solved)
      .slice(0, 6)
      .map(t => ({ tag: t.tag, solved: t.solved, attempted: t.attempted }));

    const weakTagNames = new Set(weakTags.map(t => t.tag));

    // ── Fetch problemset (cached 1 hour) ──────────────────────────────────────
    let problems;
    const cacheKey = 'problemset_all';
    if (cache.has(cacheKey)) {
      problems = cache.get(cacheKey);
    } else {
      const probRes = await axios.get(`${CF_BASE}/problemset.problems`);
      if (probRes.data.status !== 'OK') throw new Error('Failed to fetch problemset');
      problems = probRes.data.result.problems;
      cache.set(cacheKey, problems, 3600);
    }

    // ── Filter: unsolved, in rating range, has at least one weak tag ──────────
    const minRating = userRating - 100;
    const maxRating = userRating + 400;

    const recommended = problems
      .filter(p => {
        const key = `${p.contestId}-${p.index}`;
        const inRange = p.rating && p.rating >= minRating && p.rating <= maxRating;
        const unsolved = !solvedSet.has(key);
        const hasWeakTag = (p.tags || []).some(tag => weakTagNames.has(tag));
        return inRange && unsolved && hasWeakTag;
      })
      .sort((a, b) => (a.rating || 0) - (b.rating || 0))
      .slice(0, 25)
      .map(p => ({
        name: p.name,
        contestId: p.contestId,
        index: p.index,
        rating: p.rating,
        tags: p.tags || [],
        link: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`
      }));

    res.json({
      weakTags,
      userRating,
      ratingRange: { min: minRating, max: maxRating },
      recommendations: recommended
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getRecommendations };
