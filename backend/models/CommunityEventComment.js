const mongoose = require('mongoose');

const CommunityEventCommentSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityEvent', required: true, index: true },
    /** Student comments only; omitted for admin replies */
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    /** Reply to a top-level comment (admin-only via API) */
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommunityEventComment',
      default: null,
      index: true,
    },
    isAdminReply: { type: Boolean, default: false },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    /** Snapshot of nickname at post time */
    authorName: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

CommunityEventCommentSchema.index({ eventId: 1, createdAt: -1 });
CommunityEventCommentSchema.index({ eventId: 1, parentCommentId: 1, createdAt: 1 });

module.exports = mongoose.model('CommunityEventComment', CommunityEventCommentSchema);
