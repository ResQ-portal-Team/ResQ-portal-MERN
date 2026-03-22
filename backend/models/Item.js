const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    // Type: "lost" or "found"
    type: { type: String, enum: ['lost', 'found'], required: true },
    // Category for matching: "Electronics", "Wallets", "ID Cards", etc.
    category: { type: String, required: true },
    // Location for matching: "Canteen", "Lab 01", "Main Hall"
    location: { type: String, required: true },
    image: { type: String }, // URL or filename for the uploaded image
    imagePublicId: { type: String, default: null },
    date: { type: Date, default: Date.now },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Legacy "pending" values are treated as active items in the UI and routes.
    status: { type: String, enum: ['active', 'pending', 'returned'], default: 'active' },
    // Matching ID to link lost and found reports
    matchedWith: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
    // OTP for secure handover verification
    otpCode: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Item', ItemSchema);
