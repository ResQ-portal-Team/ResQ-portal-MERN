const crypto = require('crypto');
const Item = require('../models/Item');

const ACTIVE_STATUSES = ['active', 'pending'];

const parseCloudinaryUrl = () => {
    const cloudinaryUrl = process.env.CLOUDINARY_URL;

    if (!cloudinaryUrl) {
        return null;
    }

    const parsedUrl = new URL(cloudinaryUrl);

    return {
        cloudName: parsedUrl.hostname,
        apiKey: parsedUrl.username,
        apiSecret: parsedUrl.password
    };
};

const uploadImageToCloudinary = async (imageData) => {
    if (!imageData) {
        return null;
    }

    const credentials = parseCloudinaryUrl();

    if (!credentials) {
        throw new Error('Cloudinary is not configured.');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'resq-portal/items';
    const signaturePayload = `folder=${folder}&timestamp=${timestamp}${credentials.apiSecret}`;
    const signature = crypto.createHash('sha1').update(signaturePayload).digest('hex');

    const body = new URLSearchParams({
        file: imageData,
        api_key: credentials.apiKey,
        timestamp: String(timestamp),
        folder,
        signature
    });

    const response = await fetch(`https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/upload`, {
        method: 'POST',
        body
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.error?.message || 'Image upload failed.');
    }

    return {
        url: data.secure_url,
        publicId: data.public_id
    };
};

const deleteImageFromCloudinary = async (publicId) => {
    if (!publicId) {
        return;
    }

    const credentials = parseCloudinaryUrl();

    if (!credentials) {
        return;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signaturePayload = `public_id=${publicId}&timestamp=${timestamp}${credentials.apiSecret}`;
    const signature = crypto.createHash('sha1').update(signaturePayload).digest('hex');

    const body = new URLSearchParams({
        public_id: publicId,
        api_key: credentials.apiKey,
        timestamp: String(timestamp),
        signature
    });

    await fetch(`https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/destroy`, {
        method: 'POST',
        body
    });
};

const buildStatusFilter = (status) => {
    if (status === 'returned') {
        return { status: 'returned' };
    }

    if (status === 'active') {
        return { status: { $in: ACTIVE_STATUSES } };
    }

    return {};
};

const populateItemQuery = (query) =>
    query.populate('postedBy', 'realName nickname email studentId');

const sanitizeItemPayload = (body) => ({
    title: body.title?.trim(),
    description: body.description?.trim(),
    type: body.type,
    category: body.category?.trim(),
    location: body.location?.trim()
});

const validateItemPayload = (payload) => {
    if (!payload.title || !payload.description || !payload.type || !payload.category || !payload.location) {
        return 'Title, description, type, category, and location are required.';
    }

    if (!['lost', 'found'].includes(payload.type)) {
        return 'Type must be either lost or found.';
    }

    return null;
};

const canManageItem = (item, userId) => String(item.postedBy?._id || item.postedBy) === String(userId);

exports.createItem = async (req, res) => {
    try {
        const payload = sanitizeItemPayload(req.body);
        const validationError = validateItemPayload(payload);

        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        let imageUpload = null;
        if (req.body.imageData) {
            imageUpload = await uploadImageToCloudinary(req.body.imageData);
        }

        const posterId = req.user.id || req.user._id;
        if (!posterId) {
            return res.status(403).json({
                message: 'Posting items requires a user id in the token. Admin-only login does not include this yet.',
            });
        }

        const newItem = await Item.create({
            ...payload,
            image: imageUpload?.url || null,
            imagePublicId: imageUpload?.publicId || null,
            postedBy: posterId,
            status: 'active'
        });

        const savedItem = await populateItemQuery(Item.findById(newItem._id));
        const match = await populateItemQuery(Item.findOne({
            type: savedItem.type === 'lost' ? 'found' : 'lost',
            category: savedItem.category,
            location: savedItem.location,
            status: { $in: ACTIVE_STATUSES },
            _id: { $ne: savedItem._id }
        }));

        return res.status(201).json({
            message: match
                ? 'Item reported successfully and a potential match was found.'
                : 'Item reported successfully.',
            item: savedItem,
            matchFound: Boolean(match),
            matchedItem: match || null
        });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to create item.' });
    }
};

exports.getItems = async (req, res) => {
    try {
        const items = await populateItemQuery(
            Item.find(buildStatusFilter(req.query.status)).sort({ createdAt: -1 })
        );

        return res.status(200).json({ items });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch items.' });
    }
};

exports.getItemById = async (req, res) => {
    try {
        const item = await populateItemQuery(Item.findById(req.params.id));

        if (!item) {
            return res.status(404).json({ message: 'Item not found.' });
        }

        return res.status(200).json({ item });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch item.' });
    }
};

exports.updateItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found.' });
        }

        if (!canManageItem(item, req.user.id)) {
            return res.status(403).json({ message: 'Only the post author can update this item.' });
        }

        const payload = sanitizeItemPayload({ ...item.toObject(), ...req.body });
        const validationError = validateItemPayload(payload);

        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        if (req.body.imageData) {
            const uploadedImage = await uploadImageToCloudinary(req.body.imageData);

            if (item.imagePublicId) {
                await deleteImageFromCloudinary(item.imagePublicId);
            }

            item.image = uploadedImage.url;
            item.imagePublicId = uploadedImage.publicId;
        }

        item.title = payload.title;
        item.description = payload.description;
        item.type = payload.type;
        item.category = payload.category;
        item.location = payload.location;

        await item.save();

        const updatedItem = await populateItemQuery(Item.findById(item._id));
        return res.status(200).json({ message: 'Item updated successfully.', item: updatedItem });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to update item.' });
    }
};

exports.markItemAsReturned = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found.' });
        }

        if (!canManageItem(item, req.user.id)) {
            return res.status(403).json({ message: 'Only the post author can mark this item as returned.' });
        }

        item.status = 'returned';
        await item.save();

        const updatedItem = await populateItemQuery(Item.findById(item._id));
        return res.status(200).json({ message: 'Item marked as returned.', item: updatedItem });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update item status.' });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found.' });
        }

        if (!canManageItem(item, req.user.id)) {
            return res.status(403).json({ message: 'Only the post author can delete this item.' });
        }

        if (item.status !== 'returned') {
            return res.status(400).json({ message: 'Only returned items can be deleted.' });
        }

        await deleteImageFromCloudinary(item.imagePublicId);
        await item.deleteOne();

        return res.status(200).json({ message: 'Returned item deleted successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to delete item.' });
    }
};
