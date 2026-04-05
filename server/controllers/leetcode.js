const axios = require('axios');
const cache = require('../cache/cache');

const LC_GRAPHQL = 'https://leetcode.com/graphql';

const lcQuery = async (query, variables = {}) => {
  const res = await axios.post(
    LC_GRAPHQL,
    { query, variables },
    {
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0'
      }
    }
  );
  return res.data.data;
};

const getLeetCodeStats = async (req, res) => {
  try {
    const { handle } = req.params;
    const cacheKey = `lc_${handle}`;
    if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

    // ── Fetch all data in parallel ─────────────────────────────────────────────
    const [profileData, solvedData, calendarData, contestData] = await Promise.all([
      // Profile + submission stats
      lcQuery(`
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            username
            profile {
              realName
              userAvatar
              ranking
              reputation
              starRating
              countryName
              company
              school
            }
            submitStats {
              acSubmissionNum {
                difficulty
                count
                submissions
              }
              totalSubmissionNum {
                difficulty
                count
                submissions
              }
            }
            badges { name icon }
          }
        }
      `, { username: handle }),

      // Problem solving breakdown
      lcQuery(`
        query userProblemsSolved($username: String!) {
          allQuestionsCount { difficulty count }
          matchedUser(username: $username) {
            problemsSolvedBeatsStats { difficulty percentage }
            submitStatsGlobal {
              acSubmissionNum { difficulty count }
            }
          }
        }
      `, { username: handle }),

      // Submission calendar (heatmap)
      lcQuery(`
        query userProfileCalendar($username: String!) {
          matchedUser(username: $username) {
            userCalendar {
              activeYears
              streak
              totalActiveDays
              submissionCalendar
            }
          }
        }
      `, { username: handle }),

      // Contest history
      lcQuery(`
        query userContestRankingInfo($username: String!) {
          userContestRanking(username: $username) {
            attendedContestsCount
            rating
            globalRanking
            totalParticipants
            topPercentage
          }
          userContestRankingHistory(username: $username) {
            attended
            rating
            ranking
            contest { title startTime }
          }
        }
      `, { username: handle })
    ]);

    if (!profileData.matchedUser) {
      return res.status(404).json({ error: `LeetCode user "${handle}" not found` });
    }

    const user = profileData.matchedUser;
    const acStats = user.submitStats.acSubmissionNum;
    const totalStats = user.submitStats.totalSubmissionNum;

    // ── Solved counts ──────────────────────────────────────────────────────────
    const solved = {
      easy:   acStats.find(s => s.difficulty === 'Easy')?.count || 0,
      medium: acStats.find(s => s.difficulty === 'Medium')?.count || 0,
      hard:   acStats.find(s => s.difficulty === 'Hard')?.count || 0,
      total:  acStats.find(s => s.difficulty === 'All')?.count || 0,
    };

    const totalAvailable = {
      easy:   solvedData.allQuestionsCount?.find(q => q.difficulty === 'Easy')?.count || 0,
      medium: solvedData.allQuestionsCount?.find(q => q.difficulty === 'Medium')?.count || 0,
      hard:   solvedData.allQuestionsCount?.find(q => q.difficulty === 'Hard')?.count || 0,
      total:  solvedData.allQuestionsCount?.find(q => q.difficulty === 'All')?.count || 0,
    };

    // ── Beat percentages ───────────────────────────────────────────────────────
    const beats = {};
    solvedData.matchedUser?.problemsSolvedBeatsStats?.forEach(b => {
      beats[b.difficulty.toLowerCase()] = b.percentage?.toFixed(1);
    });

    // ── Submission calendar ────────────────────────────────────────────────────
    const calendar = profileData.matchedUser?.userCalendar ||
      calendarData.matchedUser?.userCalendar || {};
    let submissionCalendar = [];
    if (calendar.submissionCalendar) {
      try {
        const raw = JSON.parse(calendar.submissionCalendar);
        submissionCalendar = Object.entries(raw)
          .map(([ts, count]) => ({
            date: new Date(Number(ts) * 1000).toISOString().split('T')[0],
            count
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-365);
      } catch {}
    }

    // ── Contest data ───────────────────────────────────────────────────────────
    const contestRanking = contestData.userContestRanking;
    const contestHistory = (contestData.userContestRankingHistory || [])
      .filter(c => c.attended)
      .map(c => ({
        title: c.contest?.title,
        rating: Math.round(c.rating),
        ranking: c.ranking,
        date: c.contest?.startTime
          ? new Date(c.contest.startTime * 1000).toLocaleDateString('en-IN')
          : ''
      }))
      .slice(-20);

    // ── Acceptance rate ────────────────────────────────────────────────────────
    const totalSubs = totalStats.find(s => s.difficulty === 'All')?.submissions || 0;
    const acSubs = acStats.find(s => s.difficulty === 'All')?.submissions || 0;
    const acceptRate = totalSubs > 0 ? ((acSubs / totalSubs) * 100).toFixed(1) : '0.0';

    const result = {
      profile: {
        username: user.username,
        realName: user.profile.realName || '',
        avatar: user.profile.userAvatar,
        ranking: user.profile.ranking,
        reputation: user.profile.reputation,
        country: user.profile.countryName || '',
        company: user.profile.company || '',
        school: user.profile.school || '',
        starRating: user.profile.starRating || 0,
        badges: (user.badges || []).slice(0, 5)
      },
      solved,
      totalAvailable,
      beats,
      acceptRate,
      streak: calendar.streak || 0,
      totalActiveDays: calendar.totalActiveDays || 0,
      submissionCalendar,
      contest: {
        attended: contestRanking?.attendedContestsCount || 0,
        rating: contestRanking ? Math.round(contestRanking.rating) : 0,
        globalRanking: contestRanking?.globalRanking || 0,
        topPercentage: contestRanking?.topPercentage?.toFixed(1) || null
      },
      contestHistory
    };

    cache.set(cacheKey, result, 300);
    res.json(result);

  } catch (err) {
    console.error('LeetCode error:', err.response?.data || err.message);
    if (err.response?.status === 404 || err.message?.includes('not found')) {
      return res.status(404).json({ error: `User "${req.params.handle}" not found on LeetCode` });
    }
    res.status(500).json({ error: 'Failed to fetch LeetCode data. The user may not exist or LeetCode API may be unavailable.' });
  }
};

module.exports = { getLeetCodeStats };
