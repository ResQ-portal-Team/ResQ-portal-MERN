const express = require('express');
const jwt = require('jsonwebtoken');
const itemsController = require('../controllers/itemsController');
const Item = require('../models/Item');

const router = express.Router();

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';

        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authentication required.' });
        }

        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            return res.status(500).json({ message: 'JWT secret is not configured.' });
        }

        const token = authHeader.replace('Bearer ', '');
        req.user = jwt.verify(token, jwtSecret);
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

// Mock function for Image Tagging (replace with a real provider later)
async function getAIImageTags(imageUrl) {
    if (!imageUrl) {
        return [];
    }

    return ['item', 'campus', 'discovered'];
}

// Create item with AI tags and basic matching check
router.post('/add', authenticate, async (req, res) => {
    try {
        const { title, description, type, category, location, date, image } = req.body;
        const postedBy = req.user?.id || req.body.postedBy;

        if (!title || !description || !type || !category || !location || !postedBy) {
            return res.status(400).json({ message: 'Title, description, type, category, location, and postedBy are required.' });
        }

        const aiTags = await getAIImageTags(image);

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

        const effectiveDate = date ? new Date(date) : savedItem.date;
        const dateQuery = type === 'lost'
            ? { date: { $gte: effectiveDate } }
            : { date: { $lte: effectiveDate } };

        const match = await Item.findOne({
            type: type === 'lost' ? 'found' : 'lost',
            category,
            location,
            status: 'pending',
            ...dateQuery,
            _id: { $ne: savedItem._id }
        });

        if (match) {
            savedItem.matchedWith = match._id;
            await savedItem.save();

            match.matchedWith = savedItem._id;
            await match.save();

            const alertMessage = type === 'lost' ? 'Item Found!' : 'Owner Found!';

            return res.status(201).json({
                message: `Report successful and a potential match found! Notification: ${alertMessage}`,
                item: savedItem,
                matchFound: true,
                matchedItem: match
            });
        }

        return res.status(201).json({
            message: 'Item reported successfully!',
            item: savedItem,
            matchFound: false
        });
    } catch (err) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/', itemsController.getItems);
router.get('/:id', itemsController.getItemById);
router.post('/', authenticate, itemsController.createItem);
router.put('/:id', authenticate, itemsController.updateItem);
router.patch('/:id/return', authenticate, itemsController.markItemAsReturned);
router.delete('/:id', authenticate, itemsController.deleteItem);

module.exports = router;
