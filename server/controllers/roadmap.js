const axios = require('axios');
const cache = require('../cache/cache');
// ── Inline Groq Key Pool ─────────────────────────────────────────────────────
const _groqKeys = [];
const _groqCooldowns = {};
let _groqIndex = 0;
(() => {
  if (process.env.GROQ_API_KEY) _groqKeys.push(process.env.GROQ_API_KEY);
  let i = 1;
  while (process.env[`GROQ_API_KEY_${i}`]) { _groqKeys.push(process.env[`GROQ_API_KEY_${i}`]); i++; }
  console.log(`Groq pool: ${_groqKeys.length} key(s) loaded`);
})();
const groqRequest = async (axios, prompt) => {
  if (_groqKeys.length === 0) throw new Error('No GROQ_API_KEY configured in .env');
  let lastErr;
  for (let attempt = 0; attempt < _groqKeys.length; attempt++) {
    const now = Date.now();
    const idx = (_groqIndex + attempt) % _groqKeys.length;
    const key = _groqKeys[idx];
    if ((_groqCooldowns[key] || 0) > now) continue;
    _groqIndex = (idx + 1) % _groqKeys.length;
    try {
      return await axios.post('https://api.groq.com/openai/v1/chat/completions',
        { model:'llama-3.3-70b-versatile', messages:[{role:'user',content:prompt}], temperature:0.65, max_tokens:8000 },
        { headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${key}` }, timeout:60000 }
      );
    } catch(err) {
      lastErr = err;
      if (err.response?.status === 429) { _groqCooldowns[key] = now + 65000; continue; }
      throw err;
    }
  }
  throw lastErr || new Error('All Groq keys rate limited. Wait 1 minute and try again.');
};
const { trackRoadmap } = require('../analytics/db');
const { checkRoadmapLimit, incrementRoadmapCount, saveRoadmap } = require('../db/users');
const { optionalAuth } = require('../middleware/auth');

const CF_BASE = 'https://codeforces.com/api';

const getCFProblems = async () => {
  const cacheKey = 'cf_problemset';
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const res = await axios.get(`${CF_BASE}/problemset.problems`);
  if (res.data.status !== 'OK') throw new Error('Failed to fetch CF problemset');
  cache.set(cacheKey, res.data.result.problems, 3600);
  return res.data.result.problems;
};

const getProblemsForTopic = (allProblems, topic, minRating, maxRating, solvedSet, count = 3) => {
  const tagMap = {
    'binary search':'binary search','two pointers':'two pointers',
    'dynamic programming':'dp','dp':'dp','graphs':'graphs','graph':'graphs',
    'bfs':'graphs','dfs':'graphs','trees':'trees','tree':'trees',
    'greedy':'greedy','math':'math','number theory':'number theory',
    'strings':'strings','string':'strings','sorting':'sortings',
    'implementation':'implementation','brute force':'brute force',
    'recursion':'brute force','backtracking':'brute force',
    'bit manipulation':'bitmasks','bitmask':'bitmasks',
    'segment tree':'data structures','data structures':'data structures',
    'prefix sum':'implementation','hashing':'hashing',
    'geometry':'geometry','combinatorics':'combinatorics',
  };
  const topicLower = topic.toLowerCase();
  let cfTag = null;
  for (const [key, val] of Object.entries(tagMap)) {
    if (topicLower.includes(key)) { cfTag = val; break; }
  }
  return allProblems
    .filter(p => {
      const key = `${p.contestId}-${p.index}`;
      const inRange = p.rating && p.rating >= minRating && p.rating <= maxRating;
      const unsolved = !solvedSet.has(key);
      const hasTag = cfTag ? (p.tags || []).includes(cfTag) : true;
      return inRange && unsolved && hasTag;
    })
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map(p => ({
      name: p.name, contestId: p.contestId, index: p.index,
      rating: p.rating, tags: p.tags || [],
      link: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`
    }));
};

const getRoadmap = async (req, res) => {
  try {
    const { handle } = req.params;
    const { duration = 30 } = req.query;

    // ── Check daily limit for logged-in users ─────────────────────────────────
    if (req.user) {
      const limit = checkRoadmapLimit(req.user.id);
      if (limit.remaining <= 0) {
        return res.status(429).json({
          error: 'Daily roadmap limit reached (2/day). Come back tomorrow!',
          limitReached: true, limit: 2, remaining: 0
        });
      }
    }

    const cacheKey = `roadmap_v4_${handle}_${duration}`;
    if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

    const [userInfoRes, subRes, ratingRes] = await Promise.all([
      axios.get(`${CF_BASE}/user.info?handles=${handle}`),
      axios.get(`${CF_BASE}/user.status?handle=${handle}&from=1&count=10000`),
      axios.get(`${CF_BASE}/user.rating?handle=${handle}`)
    ]);

    if (userInfoRes.data.status !== 'OK') throw new Error('User not found');

    const userInfo = userInfoRes.data.result[0];
    const submissions = subRes.data.result;
    const ratingHistory = ratingRes.data.result;

    // ── Deep stats analysis ────────────────────────────────────────────────────
    const solvedSet = new Set();
    const tagCount = {};
    const tagRatings = {};
    const tagAttempts = {};
    const recentSolved = []; // last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 86400000;

    submissions.forEach(sub => {
      if (!sub.problem) return;
      const key = `${sub.problem.contestId}-${sub.problem.index}`;
      (sub.problem.tags || []).forEach(tag => {
        tagAttempts[tag] = (tagAttempts[tag] || 0) + 1;
      });
      if (sub.verdict === 'OK' && !solvedSet.has(key)) {
        solvedSet.add(key);
        (sub.problem.tags || []).forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
          if (!tagRatings[tag]) tagRatings[tag] = [];
          if (sub.problem.rating) tagRatings[tag].push(sub.problem.rating);
        });
        if (sub.creationTimeSeconds * 1000 > thirtyDaysAgo) {
          recentSolved.push({ tag: sub.problem.tags?.[0], rating: sub.problem.rating });
        }
      }
    });

    const tagStats = Object.entries(tagCount).map(([tag, count]) => {
      const ratings = tagRatings[tag] || [];
      const avgRating = ratings.length ? Math.round(ratings.reduce((a,b) => a+b,0) / ratings.length) : 0;
      const attempts = tagAttempts[tag] || count;
      const successRate = Math.round((count / attempts) * 100);
      return { tag, count, avgRating, successRate };
    });

    const strongTags = [...tagStats].sort((a,b) => b.count - a.count).slice(0,6);
    const weakTags = [...tagStats]
      .filter(t => t.count < 5 || t.successRate < 50)
      .sort((a,b) => a.count - b.count).slice(0,8);
    const neverTriedTags = ['dp','graphs','trees','binary search','greedy','number theory','geometry','combinatorics']
      .filter(t => !tagCount[t]);

    const userRating = userInfo.rating || 1200;
    const maxRating = userInfo.maxRating || 1200;
    const ratingDelta = ratingHistory.length >= 2
      ? ratingHistory[ratingHistory.length-1].newRating - ratingHistory[ratingHistory.length-2].newRating : 0;
    const ratingTrend = ratingDelta > 0 ? 'improving' : ratingDelta < 0 ? 'declining' : 'stable';

    // Difficulty bucket analysis
    const diffBuckets = {};
    solvedMap: for (const [key] of solvedSet.entries()) {} // just count
    solvedSet.forEach(() => {});
    submissions.forEach(sub => {
      if (sub.verdict === 'OK' && sub.problem?.rating) {
        const bucket = Math.floor(sub.problem.rating / 200) * 200;
        diffBuckets[bucket] = (diffBuckets[bucket] || 0) + 1;
      }
    });
    const comfortZone = Object.entries(diffBuckets).sort((a,b) => b[1]-a[1])[0]?.[0] || userRating;
    const recentActivity = recentSolved.length;
    const avgRecentRating = recentSolved.length
      ? Math.round(recentSolved.filter(s=>s.rating).reduce((a,s)=>a+s.rating,0)/recentSolved.filter(s=>s.rating).length)
      : userRating;

    const allProblems = await getCFProblems();

    // ── HYPER-PERSONALIZED PROMPT ──────────────────────────────────────────────
    const prompt = `You are an elite competitive programming coach with deep knowledge of Codeforces. Generate a HYPER-PERSONALIZED ${duration}-day roadmap for this SPECIFIC user. Do NOT give generic advice.

╔══ DEEP USER ANALYSIS ══╗
Handle: ${handle}
Current Rating: ${userRating} | Max Rating: ${maxRating} | Rank: ${userInfo.rank || 'unrated'}
Rating Trend: ${ratingTrend} (last contest delta: ${ratingDelta > 0 ? '+' : ''}${ratingDelta})
Total Solved: ${solvedSet.size} | Contests: ${ratingHistory.length}
Recent Activity (last 30 days): ${recentActivity} problems solved
Average Recent Difficulty: ${avgRecentRating} (their current comfort zone: ~${comfortZone})

STRONG TOPICS (already solved many):
${strongTags.map(t => `  • ${t.tag}: ${t.count} solved, avg difficulty ${t.avgRating}, ${t.successRate}% success`).join('\n')}

WEAK TOPICS (low count or low success rate):
${weakTags.map(t => `  • ${t.tag}: only ${t.count} solved, avg difficulty ${t.avgRating}, ${t.successRate}% success`).join('\n')}

NEVER TRIED (0 problems):
${neverTriedTags.length > 0 ? neverTriedTags.map(t => `  • ${t}`).join('\n') : '  • None — has tried all major topics'}

Rating gap analysis:
- Current: ${userRating}, comfort zone: ~${comfortZone} rated problems
- To reach next milestone (${Math.ceil(userRating/200)*200 + 200}), needs to solve ${userRating < 1200 ? 'implementation & greedy' : userRating < 1600 ? 'dp & graph problems consistently' : userRating < 2000 ? 'advanced ds & hard math' : 'competitive math & advanced algorithms'}
╚═════════════════════════╝

╔══ COACHING DIRECTIVE ══╗
1. NEVER suggest topics from STRONG TOPICS — they already know these
2. PRIORITIZE weakest topics & never-tried topics in weeks 1-2
3. Set target difficulty = ${Math.min(userRating + 300, 3500)} for end of roadmap
4. Daily problems should be ${userRating < 1200 ? '800-1200' : userRating < 1600 ? '1200-1600' : userRating < 2000 ? '1500-2000' : '1800-2500'} rated
5. Since rating is ${ratingTrend}, ${ratingTrend === 'declining' ? 'focus on fundamentals and confidence-building with easier wins first' : ratingTrend === 'improving' ? 'maintain momentum and push slightly beyond comfort zone' : 'break out of plateau with focused weak-topic practice'}
6. They solve ~${comfortZone} rated problems comfortably — push to ~${Number(comfortZone) + 200} by end
7. Reference their ACTUAL data — e.g. "you have ${tagCount['dp'] != null ? tagCount['dp'] : 0} dp problems solved, we need to get to 30+"
8. Each day goal must be hyper-specific: not "solve graphs" but "solve 2 BFS shortest-path problems rated ${userRating}-${userRating+200}"
╚══════════════════════════╝

CRITICAL: You MUST generate ALL ${Math.ceil(Number(duration)/7)} weeks with ALL days. Do NOT stop after week 1. The roadmap must cover the FULL ${duration} days.

IMPORTANT: Raw JSON only. No markdown. No backticks.

{
  "summary": "4-5 sentences specifically referencing this user's ${userRating} rating, ${ratingTrend} trend, ${solvedSet.size} solved problems, and the exact gaps identified above",
  "targetRating": ${Math.min(userRating + (Number(duration) >= 60 ? 300 : Number(duration) <= 14 ? 100 : 200), 3500)},
  "personalizedInsights": {
    "currentStrength": "specific sentence about what they're genuinely good at from the data",
    "biggestGap": "the single most impactful thing holding them back from rating ${Math.ceil(userRating/200)*200 + 200}",
    "quickWin": "one specific thing they can do in the first 3 days to gain rating fast",
    "longTermFocus": "the topic they need to master most for sustained growth"
  },
  "milestones": [
    { "week": 1, "goal": "specific goal with numbers", "metric": "measurable outcome" },
    { "week": ${Math.ceil(Number(duration)/14)}, "goal": "mid-point goal", "metric": "measurable outcome" },
    { "week": ${Math.ceil(Number(duration)/7)}, "goal": "end goal referencing target ${Math.min(userRating + 200, 3500)} rating", "metric": "measurable outcome" }
  ],
  "weeks": [
    REPEAT THIS OBJECT FOR EACH OF THE ${Math.ceil(Number(duration)/7)} WEEKS — DO NOT OMIT ANY WEEK:
    {
      "week": <week_number_1_to_${Math.ceil(Number(duration)/7)}>,
      "theme": "specific theme targeting their actual weakest area",
      "focus": "one precise sentence referencing their data",
      "days": [
        { "day": 1, "topic": "exact topic from: graphs, dp, binary search, greedy, math, trees, strings, implementation, brute force, bitmasks, number theory, geometry, combinatorics, two pointers, divide and conquer", "goal": "hyper-specific goal e.g. 'Solve 3 BFS problems rated ${userRating}-${userRating+100}'", "problemTypes": ["specific type 1", "specific type 2"], "difficulty": "${userRating}-${userRating+100}", "whyToday": "one sentence WHY", "tip": "hyper-specific tip" },
        { "day": 2, "topic": "...", "goal": "...", "problemTypes": [], "difficulty": "...", "whyToday": "...", "tip": "..." },
        { "day": 3, "topic": "...", "goal": "...", "problemTypes": [], "difficulty": "...", "whyToday": "...", "tip": "..." },
        { "day": 4, "topic": "...", "goal": "...", "problemTypes": [], "difficulty": "...", "whyToday": "...", "tip": "..." },
        { "day": 5, "topic": "...", "goal": "...", "problemTypes": [], "difficulty": "...", "whyToday": "...", "tip": "..." },
        { "day": 6, "topic": "...", "goal": "...", "problemTypes": [], "difficulty": "...", "whyToday": "...", "tip": "..." },
        { "day": 7, "topic": "...", "goal": "...", "problemTypes": [], "difficulty": "...", "whyToday": "...", "tip": "..." }
      ]
    }
    YOU MUST PRODUCE ALL ${Math.ceil(Number(duration)/7)} WEEK OBJECTS. Every week must have 7 fully filled days.
  ],
  "motivation": "personalized message referencing their exact rating ${userRating}, the ${ratingTrend} trend, and a specific encouragement tied to their data"
}`;

    const rawText = (await groqRequest(prompt)).replace(/```json|```/g, '').trim();
    const roadmap = JSON.parse(rawText);

    roadmap.weeks = roadmap.weeks.map(week => ({
      ...week,
      days: week.days.map(day => {
        const match = day.difficulty?.match(/(\d+)[^\d]+(\d+)/);
        const minR = match ? parseInt(match[1]) : Math.max(800, userRating - 200);
        const maxR = match ? parseInt(match[2]) : userRating + 200;
        return { ...day, cfProblems: getProblemsForTopic(allProblems, day.topic, minR, maxR, solvedSet, 3) };
      })
    }));

    // Track analytics
    try { trackRoadmap(); } catch(e) {}

    const result = {
      handle, userRating, userRank: userInfo.rank || 'unrated',
      maxRating, ratingTrend, totalSolved: solvedSet.size,
      duration: Number(duration), weakTags: weakTags.map(t=>t.tag),
      strongTags: strongTags.map(t=>t.tag), neverTriedTags,
      roadmap, generatedAt: new Date().toISOString()
    };

    cache.set(cacheKey, result, 1800);

    // ── Increment limit & auto-save for logged-in users ───────────────────────
    if (req.user) {
      try {
        incrementRoadmapCount(req.user.id);
        saveRoadmap(
          req.user.id, 'cf', handle, Number(duration),
          `${duration}-Day CF Roadmap (Rating ${userRating})`,
          roadmap.summary, roadmap.targetRating, result
        );
      } catch(e) { console.error('Save error:', e.message); }
    }

    res.json(result);

  } catch (err) {
    console.error('Roadmap error:', err.response?.data || err.message);
    if (err.response?.status === 429 || err.message?.includes('rate limit') || err.message?.includes('rate limited')) return res.status(429).json({ error: err.message || 'All API keys rate limited. Try again in 1 minute.' });
    if (err instanceof SyntaxError) return res.status(500).json({ error: 'Failed to parse AI response. Try again.' });
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getRoadmap, optionalAuth };
