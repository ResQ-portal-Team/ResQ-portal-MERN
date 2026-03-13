const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route for real-time validation
router.post('/check-existing', authController.checkExisting);

// Route for final registration
router.post('/register', authController.register);

// Route for dashboard statistics
router.get('/stats', authController.getStats);

module.exports = router;