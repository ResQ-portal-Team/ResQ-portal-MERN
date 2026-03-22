const ContactMessage = require('../models/ContactMessage');

exports.create = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return res.status(400).json({ message: 'Name, email, subject, and message are required.' });
    }
    const userId = req.user?.id || null;
    const created = await ContactMessage.create({
      name: name.trim(),
      email: email.trim(),
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
    await contact.save();
    res.status(200).json({ message: 'Marked as resolved.', contact });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update contact message.' });
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
