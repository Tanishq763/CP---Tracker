const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  googleLogin, getMe, updateUserHandles,
  saveRoadmapToHistory, getHistory, getSingleRoadmap,
  deleteRoadmapEntry, getRoadmapLimit
} = require('../controllers/authController');

// Public
router.post('/google',          googleLogin);

// Protected
router.get('/me',               requireAuth, getMe);
router.put('/handles',          requireAuth, updateUserHandles);
router.get('/roadmap-limit',    requireAuth, getRoadmapLimit);
router.post('/roadmaps',        requireAuth, saveRoadmapToHistory);
router.get('/roadmaps',         requireAuth, getHistory);
router.get('/roadmaps/:id',     requireAuth, getSingleRoadmap);
router.delete('/roadmaps/:id',  requireAuth, deleteRoadmapEntry);

module.exports = router;
