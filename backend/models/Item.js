const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['lost', 'found'], required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    image: { type: String, default: '' },
    date: { type: Date, default: Date.now },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['active', 'pending', 'returned'], default: 'active' },
    matchedWith: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
    otpCode: { type: String, default: null },
    returnedAt: { type: Date, default: null }
}, { timestamps: true });

ItemSchema.index({ status: 1, type: 1, category: 1, location: 1, createdAt: -1 });

module.exports = mongoose.model('Item', ItemSchema);
