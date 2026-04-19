const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true },
    realName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    nickname: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    trustScore: { type: Number, default: 0, min: 0 },  // 🆕 ADDED
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);