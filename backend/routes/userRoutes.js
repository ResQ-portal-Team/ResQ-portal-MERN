const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  getLeaderboard, 
  getUserProfile, 
  updateUserProfile 
} = require('../controllers/userController');

// Protect all routes
router.use(protect);

// Leaderboard routes
router.get('/leaderboard', getLeaderboard);

// User profile routes
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

module.exports = router;