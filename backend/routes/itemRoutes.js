const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

// Mock function for Image Tagging (Replace with actual API call like Imagga later)
async function getAIImageTags(imageUrl) {
    // Placeholder tags until AI API is integrated
    return ["item", "campus", "discovered"];
}

// Create a new item and check for matching items
router.post('/add', async (req, res) => {
    try {
        const { title, description, type, category, location, date, image, postedBy } = req.body;

        // Fetch AI tags for the uploaded image
        const aiTags = await getAIImageTags(image);

        // Create the new item with AI tags
        const newItem = new Item({
            title,
            description,
            type,
            category,
            location,
            date,
            image,
            postedBy,
            imageTags: aiTags
        });

        const savedItem = await newItem.save();

        // INTELLIGENT MATCHING LOGIC
        // Date logic: Lost date must be before or equal to the Found date
        const dateQuery = type === 'lost' 
            ? { date: { $gte: new Date(date) } } // If lost, look for found items on or after this date
            : { date: { $lte: new Date(date) } }; // If found, look for lost items on or before this date

        const match = await Item.findOne({
            type: type === 'lost' ? 'found' : 'lost', // Match with opposite type
            category: category,
            location: location,
            status: 'pending',
            ...dateQuery,
            _id: { $ne: savedItem._id } // Avoid matching with itself
        });

        // If a potential match is found
        if (match) {
            // Update both items to link them via matchedWith field
            savedItem.matchedWith = match._id;
            await savedItem.save();

            match.matchedWith = savedItem._id;
            await match.save();

            // Determine notification message based on current item type
            const alertMessage = type === 'lost' ? "Item Found!" : "Owner Found!";

            return res.status(201).json({
                message: `Report successful and a potential match found! Notification: ${alertMessage}`,
                item: savedItem,
                matchFound: true,
                matchedItem: match
            });
        }

        // Response if no match is found
        res.status(201).json({
            message: "Item reported successfully!",
            item: savedItem,
            matchFound: false
        });

    } catch (err) {
        console.error("Error in item reporting:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;