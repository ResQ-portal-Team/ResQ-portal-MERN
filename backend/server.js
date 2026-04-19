const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
// Backend folder .env wins for EMAIL_*, MONGO_URI, etc. (root .env often lacks Gmail keys).
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });

const mailUser = (process.env.EMAIL_USER || '').trim();
const mailPass = String(process.env.EMAIL_PASS || '').replace(/\s/g, '');
if (mailUser && mailPass) {
    console.log(`📧 Password-reset email ready (${mailUser})`);
} else {
    console.warn('⚠️  EMAIL_USER or EMAIL_PASS missing — forgot-password OTP will not send.');
}

const resqOtpFlag = String(process.env.RESQ_SHOW_OTP_IN_RESPONSE || '').trim().replace(/\r$/, '').toLowerCase();
if (['1', 'true', 'yes', 'on'].includes(resqOtpFlag)) {
    console.warn('⚠️  RESQ_SHOW_OTP_IN_RESPONSE is on — OTP is returned in API JSON (demos only; turn off in production).');
}
console.log('📨 OTP copy to sender:', ['0', 'false', 'no', 'off'].includes(String(process.env.RESQ_EMAIL_OTP_COPY_TO_SENDER || '').trim().replace(/\r$/, '').toLowerCase()) ? 'off' : 'on (second email to EMAIL_USER)');

const app = express();

// --- PORT Definition - Move this to the TOP ---
const PORT = process.env.PORT || 5000;

// --- Middleware ---
const requestBodyLimit = '50mb';
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: requestBodyLimit }));
app.use(express.urlencoded({ limit: requestBodyLimit, extended: true }));

// --- Routes ---
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const adminRoutes = require('./routes/adminRoutes');
const contactRoutes = require('./routes/contactRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes'); // 🆕 ADDED
const CommunityEvent = require('./models/CommunityEvent');
const { enrichEvent, splitUpcomingFinished } = require('./utils/communityEventStatus');
const eventPollController = require('./controllers/eventPollController');
const communityEventSocialController = require('./controllers/communityEventSocialController');
const { optionalAuthenticate, authenticate } = require('./middleware/authMiddleware');

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes); // 🆕 ADDED

app.get('/api/community-events', async (req, res) => {
  try {
    const raw = await CommunityEvent.find().sort({ startDateTime: 1 }).lean();
    const enriched = raw.map(enrichEvent);
    const { upcoming, finished } = splitUpcomingFinished(enriched);
    res.status(200).json({ upcoming, finished });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load community events.' });
  }
});

app.post('/api/community-events/:id/poll', eventPollController.submit);

app.get(
  '/api/community-events/:id/social',
  optionalAuthenticate,
  communityEventSocialController.getSocial
);
app.post('/api/community-events/:id/like', authenticate, communityEventSocialController.toggleLike);
app.post('/api/community-events/:id/comments', authenticate, communityEventSocialController.addComment);

app.get('/api/community-events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    const event = await CommunityEvent.findById(id).lean();
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    res.status(200).json({ event: enrichEvent(event) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load event.' });
  }
});

// --- MongoDB Connection ---
const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/resq_portal";

mongoose.connect(uri)
    .then(() => {
        console.log(uri.includes('127.0.0.1') ? "✅ MongoDB Local Connected!" : "✅ MongoDB Atlas Connected!");
    })
    .catch(err => {
        console.error("❌ MongoDB Connection Error: ", err.message);
    });

app.get('/', (req, res) => {
    res.send("ResQ-Portal Backend is running smoothly...");
});

// --- Socket.IO Server Initialization ---
const { initializeSocket } = require('./socketServer');

// Create server and start listening
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Initialize Socket.IO for real-time chat
initializeSocket(server);