const mongoose = require('mongoose');

const EXPERIENCE = ['Good', 'Average', 'Bad'];
const BEST_PART = ['Activities', 'Speaker', 'Food', 'Organization'];

const EventPollResponseSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommunityEvent',
      required: true,
      index: true,
    },
    /** All optional — visitors may answer only what they want */
    attended: { type: Boolean },
    rating: { type: Number, min: 1, max: 5 },
    experience: { type: String, enum: EXPERIENCE },
    bestPart: { type: String, enum: BEST_PART },
    suggestion: { type: String, default: '', trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

EventPollResponseSchema.index({ eventId: 1, createdAt: -1 });

const EventPollResponse = mongoose.model('EventPollResponse', EventPollResponseSchema);
EventPollResponse.EXPERIENCE = EXPERIENCE;
EventPollResponse.BEST_PART = BEST_PART;
module.exports = EventPollResponse;
