const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
// const cors = require('cors'); // අනවශ්‍යයි, මම මේක comment කළා (ඕනනම් අයින් කරලා දාන්න)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env'), override: false });

const app = express();

// --- Middleware ---
// app.use(cors()); // Proxy එක පාවිච්චි කරන නිසා CORS දැන් අත්‍යවශ්‍ය නැහැ
const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || '10mb';
app.use(express.json({ limit: requestBodyLimit }));
app.use(express.urlencoded({ limit: requestBodyLimit, extended: true }));

// --- Routes ---
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);

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