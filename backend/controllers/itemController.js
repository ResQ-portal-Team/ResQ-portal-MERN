const { v2: cloudinary } = require('cloudinary');
const Item = require('../models/Item');

const ACTIVE_STATUSES = ['active', 'pending'];

cloudinary.config({ secure: true });

const buildItemFilters = ({ status, type, search }) => {
    const filters = {};

    if (status === 'active') {
        filters.status = { $in: ACTIVE_STATUSES };
    } else if (status === 'returned') {
        filters.status = 'returned';
    }

    if (type && ['lost', 'found'].includes(type)) {
        filters.type = type;
    }

    if (search) {
        const regex = new RegExp(search, 'i');
        filters.$or = [
            { title: regex },
            { description: regex },
            { category: regex },
            { location: regex }
        ];
    }

    return filters;
};

exports.getItems = async (req, res) => {
    try {
        const filters = buildItemFilters(req.query);
        const items = await Item.find(filters).sort({ createdAt: -1 });
        res.status(200).json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createItem = async (req, res) => {
    try {
        const { title, description, type, category, location, imageData, postedBy } = req.body;

        if (!title || !type || !category || !location) {
            return res.status(400).json({
                error: 'Title, type, category, and location are required.'
            });
        }

        let imageUrl = '';

        if (imageData) {
            const uploadResult = await cloudinary.uploader.upload(imageData, {
                folder: 'resq-portal/items',
                resource_type: 'image'
            });
            imageUrl = uploadResult.secure_url;
        }

        const savedItem = await Item.create({
            title,
            description,
            type,
            category,
            location,
            image: imageUrl,
            postedBy: postedBy || null,
            status: 'active'
        });

        const match = await Item.findOne({
            type: savedItem.type === 'lost' ? 'found' : 'lost',
            category: savedItem.category,
            location: savedItem.location,
            status: { $in: ACTIVE_STATUSES },
            _id: { $ne: savedItem._id }
        });

        if (match) {
            return res.status(201).json({
                message: 'Item reported successfully and a potential match found!',
                item: savedItem,
                matchFound: true,
                matchedItem: match
            });
        }

        res.status(201).json({
            message: 'Item reported successfully!',
            item: savedItem,
            matchFound: false
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.markItemAsReturned = async (req, res) => {
    try {
        const updatedItem = await Item.findByIdAndUpdate(
            req.params.id,
            { status: 'returned', returnedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!updatedItem) {
            return res.status(404).json({ error: 'Item not found.' });
        }

        res.status(200).json({
            message: 'Item moved to the Returned List.',
            item: updatedItem
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
