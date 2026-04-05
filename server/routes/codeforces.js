const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/statsController');
const { getRecommendations } = require('../controllers/recommender');
const { getRoadmap } = require('../controllers/roadmap');
const { getLeetCodeStats } = require('../controllers/leetcode');
const { getLCRoadmap } = require('../controllers/lcRoadmap');
const { recordVisit, recordRoadmap, getDashboard } = require('../controllers/analytics');

router.get('/user/:handle/stats',     getStats);
router.get('/user/:handle/recommend', getRecommendations);
router.get('/user/:handle/roadmap',   getRoadmap);

router.get('/leetcode/:handle/stats',   getLeetCodeStats);
router.get('/leetcode/:handle/roadmap', getLCRoadmap);

router.post('/analytics/visit',         recordVisit);
router.post('/analytics/roadmap',       recordRoadmap);
router.get('/analytics/dashboard',      getDashboard);

module.exports = router;
