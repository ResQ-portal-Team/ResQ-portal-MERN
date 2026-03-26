const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  senderNickname: String,
  text: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  messageType: {
    type: String,
    enum: ['text', 'system', 'handover_request', 'handover_confirmed'],
    default: 'text'
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);