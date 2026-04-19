const mongoose = require('mongoose');

const CommunityEventLikeSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityEvent', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

CommunityEventLikeSchema.index({ eventId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('CommunityEventLike', CommunityEventLikeSchema);
