const crypto = require('crypto');
const https = require('https');
const Item = require('../models/Item');

const ACTIVE_STATUSES = ['active', 'pending'];

const createHttpError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const parseCloudinaryUrl = () => {
    const cloudinaryUrl = process.env.CLOUDINARY_URL;

    if (!cloudinaryUrl) {
        return null;
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(cloudinaryUrl);
    } catch (error) {
        return null;
    }

    return {
        cloudName: parsedUrl.hostname,
        apiKey: parsedUrl.username,
        apiSecret: parsedUrl.password
    };
};

const postForm = (urlString, formParams) =>
    new Promise((resolve, reject) => {
        const url = new URL(urlString);
        const body = formParams.toString();
        let settled = false;

        const fail = (error) => {
            if (settled) {
                return;
            }
            settled = true;
            reject(error);
        };

        const succeed = (data) => {
            if (settled) {
                return;
            }
            settled = true;
            resolve(data);
        };

        const request = https.request(
            {
                hostname: url.hostname,
                path: `${url.pathname}${url.search}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(body)
                }
            },
            (response) => {
                let responseBody = '';

                response.on('data', (chunk) => {
                    responseBody += chunk;
                });

                response.on('end', () => {
                    let data = {};

                    try {
                        data = responseBody ? JSON.parse(responseBody) : {};
                    } catch (error) {
                        return fail(createHttpError('Invalid response from image service.', 502));
                    }

                    if (response.statusCode < 200 || response.statusCode >= 300) {
                        return fail(createHttpError(data?.error?.message || 'Image upload failed.', 502));
                    }

                    return succeed(data);
                });
            }
        );

        request.on('error', () => {
            fail(createHttpError('Unable to reach image service.', 502));
        });

        request.setTimeout(15000, () => {
            request.destroy();
            fail(createHttpError('Image service timeout. Please try again.', 504));
        });

        request.write(body);
        request.end();
    });

const uploadImageToCloudinary = async (imageData) => {
    if (!imageData) {
        return null;
    }

    const credentials = parseCloudinaryUrl();

    if (!credentials) {
        throw createHttpError('Image upload is unavailable. Cloudinary is not configured.', 503);
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

    const data = await postForm(`https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/upload`, body);

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

    await postForm(`https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/destroy`, body);
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
        let imageWarning = '';
        if (req.body.imageData) {
            try {
                imageUpload = await uploadImageToCloudinary(req.body.imageData);
            } catch (error) {
                imageWarning = error.message || 'Image upload failed.';
            }
        }

        const newItem = await Item.create({
            ...payload,
            image: imageUpload?.url || null,
            imagePublicId: imageUpload?.publicId || null,
            postedBy: req.user.id,
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
            message: `${match
                ? 'Item reported successfully and a potential match was found.'
                : 'Item reported successfully.'}${imageWarning ? ` ${imageWarning}` : ''}`,
            item: savedItem,
            matchFound: Boolean(match),
            matchedItem: match || null
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        console.error('Create item error:', error);
        return res.status(statusCode).json({ message: error.message || 'Failed to create item.' });
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
            try {
                const uploadedImage = await uploadImageToCloudinary(req.body.imageData);

                if (item.imagePublicId) {
                    await deleteImageFromCloudinary(item.imagePublicId);
                }

                item.image = uploadedImage.url;
                item.imagePublicId = uploadedImage.publicId;
            } catch (error) {
                return res.status(error.statusCode || 502).json({
                    message: error.message || 'Unable to upload the new image.'
                });
            }
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
        const statusCode = error.statusCode || 500;
        console.error('Update item error:', error);
        return res.status(statusCode).json({ message: error.message || 'Failed to update item.' });
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
