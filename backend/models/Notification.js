const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  type: {
    type: String,
    enum: ['match_found', 'item_returned', 'new_message'],
    required: [true, 'Notification type is required']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    index: true
  },
  chatRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    index: true
  },
  itemTitle: {
    type: String,
    trim: true,
    maxlength: [100, 'Item title cannot exceed 100 characters']
  },
  
  // 🆕 Match specific fields
  matchScore: {
    type: Number,
    min: 0,
    max: 115,
    default: null
  },
  matchData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  read: {
    type: Boolean,
    default: false,
    index: true
  }
}, { 
  timestamps: true 
});

// Compound indexes for better query performance
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

// Virtual for match percentage
notificationSchema.virtual('matchPercentage').get(function() {
  if (this.matchScore === null || this.matchScore === undefined) return null;
  return Math.round((this.matchScore / 115) * 100);
});

// Ensure virtuals are included in JSON output
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);