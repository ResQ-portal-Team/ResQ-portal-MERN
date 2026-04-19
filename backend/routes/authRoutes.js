const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/public-config', authController.publicAuthConfig);

// Route for real-time validation
router.post('/check-existing', authController.checkExisting);

// Route for final registration
router.post('/register', authController.register);

// Route for login
router.post('/login', authController.login);

router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOtp);
router.post('/reset-password', authController.resetPassword);

// Route for dashboard statistics
router.get('/stats', authController.getStats);

module.exports = router;