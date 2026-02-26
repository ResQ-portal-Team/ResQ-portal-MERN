const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true },
    realName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    nickname: { type: String, required: true, unique: true }, // Display Name
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);