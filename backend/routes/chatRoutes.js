const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // ✅ Now protect is exported
const {
  getOrCreateChatRoom,
  getMessages,
  clearMessages,
  getUserChatRooms,
  generateOTP,
  verifyOTP
} = require('../controllers/chatController');

// Apply protect middleware to all routes
router.use(protect);

// Routes
router.post('/room', getOrCreateChatRoom);
router.get('/rooms', getUserChatRooms);
router.get('/room/:chatRoomId/messages', getMessages);
router.delete('/room/:chatRoomId/messages', clearMessages);
router.post('/room/:chatRoomId/otp', generateOTP);
router.post('/room/:chatRoomId/verify', verifyOTP);

module.exports = router;