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
    imageTags: { type: [String], default: [] }, // AI Matching ekata keywords save karanna 
    date: { type: Date, default: Date.now },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Status: "pending" for active posts, "returned" for matched and handed over items
    status: { type: String, enum: ['pending', 'returned'], default: 'pending' },
    // Matching ID to link lost and found reports
    matchedWith: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
    // OTP for secure handover verification
    otpCode: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Item', ItemSchema);