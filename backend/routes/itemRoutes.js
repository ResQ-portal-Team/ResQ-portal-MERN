const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

// Create a new item and check for matching items
router.post('/add', async (req, res) => {
    try {
        const newItem = new Item(req.body);
        const savedItem = await newItem.save();

        // 1. Matching Logic: එකම category සහ location ඇති ප්‍රතිවිරුද්ධ වර්ගයේ අයිටම් එකක් සොයයි
        const match = await Item.findOne({
            type: savedItem.type === 'lost' ? 'found' : 'lost',
            category: savedItem.category,
            location: savedItem.location,
            status: 'pending', // තවමත් හිමිකරුට ලැබී නැති අයිටම් පමණක් සොයයි
            _id: { $ne: savedItem._id } // දැනට සේව් කරන අයිටම් එකම නැවත මැච් නොවීමට
        });

        // 2. මැච් එකක් හම්බවුණොත් alert එකක් සමඟ රෙස්පොන්ස් එක යවයි
        if (match) {
            return res.status(201).json({
                message: "Item reported successfully and a potential match found!",
                item: savedItem,
                matchFound: true,
                matchedItem: match // මැච් වුණු අයිටම් එකේ විස්තර මෙතැනදී ලැබේ
            });
        }

        // 3. මැච් එකක් නැතිනම් අයිටම් එක පමණක් සේව් කරයි
        res.status(201).json({
            message: "Item reported successfully!",
            item: savedItem,
            matchFound: false
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;