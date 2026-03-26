const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    nickname: String,
    joinedAt: { type: Date, default: Date.now },
    lastReadAt: Date
  }],
  status: {
    type: String,
    enum: ['pending', 'active', 'handover', 'closed'],
    default: 'pending'
  },
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  handoverOTP: {
    otp: String,
    generatedAt: Date,
    expiresAt: Date,
    verifiedBy: mongoose.Schema.Types.ObjectId,
    verifiedAt: Date
  },
  lastMessage: {
    text: String,
    senderId: mongoose.Schema.Types.ObjectId,
    sentAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);