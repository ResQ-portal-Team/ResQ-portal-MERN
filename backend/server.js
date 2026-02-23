const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = process.env.MONGO_URI;
mongoose.connect(uri)
    .then(() => console.log("✅ MongoDB Atlas Connected!"))
    .catch(err => console.log("❌ Connection Error: ", err));

// Basic Route
app.get('/', (req, res) => {
    res.send("ResQ-Portal Backend is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));