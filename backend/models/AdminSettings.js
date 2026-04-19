const mongoose = require('mongoose');

/** Single document: persisted admin password hash after OTP reset (id: "admin"). */
const AdminSettingsSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    passwordHash: { type: String, required: true },
});

module.exports = mongoose.model('AdminSettings', AdminSettingsSchema);
