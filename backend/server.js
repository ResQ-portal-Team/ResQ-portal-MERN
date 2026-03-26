const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env'), override: false });

const app = express();

// --- Middleware ---
const requestBodyLimit = '50mb'; // Limit එක කෙලින්ම 50mb කලා
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
const CommunityEvent = require('./models/CommunityEvent');
const { enrichEvent, splitUpcomingFinished } = require('./utils/communityEventStatus');
const eventPollController = require('./controllers/eventPollController');

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contacts', contactRoutes);

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});