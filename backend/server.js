const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

app.use('/api/items', require('./routes/itemRoutes'));

// MongoDB Connection
const uri = process.env.MONGO_URI;

mongoose.connect(uri)
    .then(() => {
        // මෙතන තමයි කලින් වැරදි මැසේජ් එක තිබ්බේ. දැන් මේක හරියට පේනවා.
        if (uri.includes('127.0.0.1') || uri.includes('localhost')) {
            console.log("✅ MongoDB Local Connected!");
        } else {
            console.log("✅ MongoDB Atlas Connected!");
        }
    })
    .catch(err => console.log("❌ Connection Error: ", err));

// Basic Route
app.get('/', (req, res) => {
    res.send("ResQ-Portal Backend is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));