const mongoose = require('mongoose');

const CommunityEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date },
    location: { type: String, required: true, trim: true },
    organizer: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: null },
    imagePublicId: { type: String, default: null },
    videoUrl: { type: String, default: null },
    videoPublicId: { type: String, default: null },
    contactInfo: { type: String, default: null, trim: true },
    /** Admin-only: treat as finished even if start date is still today or in the future */
    manuallyFinished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CommunityEvent', CommunityEventSchema);
