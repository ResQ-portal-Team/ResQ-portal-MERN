const ContactMessage = require('../models/ContactMessage');

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

exports.create = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return res.status(400).json({ message: 'Name, email, subject, and message are required.' });
    }
    const userId = req.user?.id || null;
    const accountEmail = normalizeEmail(req.user?.email);
    const submittedEmail = normalizeEmail(email);
    const created = await ContactMessage.create({
      name: name.trim(),
      // If user is logged in, bind notifications to account email regardless of typed email.
      email: accountEmail || submittedEmail,
      subject: subject.trim(),
      message: message.trim(),
      userId,
    });
    res.status(201).json({ message: 'Your message has been sent. Our team will get back to you soon.', contact: created });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit your message.' });
  }
};

exports.adminList = async (req, res) => {
  try {
    const contacts = await ContactMessage.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ contacts });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load contact messages.' });
  }
};

exports.adminResolve = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await ContactMessage.findById(id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact message not found.' });
    }
    contact.status = 'resolved';
    contact.resolvedAt = new Date();
    contact.resolvedSeenByUser = false;
    await contact.save();
    res.status(200).json({ message: 'Marked as resolved.', contact });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update contact message.' });
  }
};

exports.myResolvedNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userEmail = normalizeEmail(req.user?.email);
    const contacts = await ContactMessage.find({
      status: 'resolved',
      $or: [{ userId }, { email: userEmail }],
    })
      .sort({ resolvedAt: -1, createdAt: -1 })
      .lean();
    res.status(200).json({ notifications: contacts });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load notifications.' });
  }
};

exports.markNotificationSeen = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userEmail = normalizeEmail(req.user?.email);

    const contact = await ContactMessage.findOne({
      _id: id,
      status: 'resolved',
      $or: [{ userId }, { email: userEmail }],
    });

    if (!contact) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    contact.resolvedSeenByUser = true;
    await contact.save();
    return res.status(200).json({ message: 'Notification marked as seen.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update notification.' });
  }
};

exports.adminDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await ContactMessage.findById(id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact message not found.' });
    }
    await contact.deleteOne();
    res.status(200).json({ message: 'Contact message deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete contact message.' });
  }
};
