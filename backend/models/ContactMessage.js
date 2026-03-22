const mongoose = require('mongoose');

const ContactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ['new', 'resolved'], default: 'new' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
    resolvedSeenByUser: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ContactMessage', ContactMessageSchema);
