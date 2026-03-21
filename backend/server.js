const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env'), override: false });

const app = express();

// --- Middleware ---
/** Base64 video/image payloads need a higher limit; override in .env if needed. */
const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || '50mb';
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  })
);
app.use(express.json({ limit: requestBodyLimit }));
app.use(express.urlencoded({ limit: requestBodyLimit, extended: true }));

// --- Routes ---
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const adminRoutes = require('./routes/adminRoutes');
const CommunityEvent = require('./models/CommunityEvent');

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
/** Admin routes: GET /api/admin/health (no auth), then /users, /items, … (JWT + role admin) */
app.use('/api/admin', adminRoutes);

/** Public list for Community Hub (read-only) */
app.get('/api/community-events', async (req, res) => {
  try {
    const events = await CommunityEvent.find().sort({ startDateTime: -1 }).lean();
    res.status(200).json({ events });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load community events.' });
  }
});

/** Single event for hub detail page */
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
    res.status(200).json({ event });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load event.' });
  }
});

// --- MongoDB Connection ---
const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/resq_portal";

mongoose.connect(uri)
    .then(() => {
        if (uri.includes('127.0.0.1') || uri.includes('localhost')) {
            console.log("✅ MongoDB Local Connected!");
        } else {
            console.log("✅ MongoDB Atlas Connected!");
        }
    })
    .catch(err => {
        console.error("❌ MongoDB Connection Error: ", err.message);
        console.log("💡 Tip: Make sure your MongoDB Server is running locally.");
    });

// --- Basic Route ---
app.get('/', (req, res) => {
    res.send("ResQ-Portal Backend is running smoothly...");
});

// --- Server Startup ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});