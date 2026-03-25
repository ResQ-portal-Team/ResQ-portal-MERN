const crypto = require('crypto');
const Item = require('../models/Item');
const { ALLOWED_ITEM_CATEGORIES } = require('../constants/itemCategories');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Gemini Config
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const ACTIVE_STATUSES = ['active', 'pending'];

const parseCloudinaryUrl = () => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) return null;
    
    return { cloudName, apiKey, apiSecret };
};

const uploadImageToCloudinary = async (imageData) => {
    if (!imageData) return null;
    const credentials = parseCloudinaryUrl();
    if (!credentials) throw new Error('Cloudinary is not configured. Please check your .env file.');

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'resq-portal/items';
    
    const signaturePayload = `folder=${folder}&timestamp=${timestamp}${credentials.apiSecret}`;
    const signature = crypto.createHash('sha1').update(signaturePayload).digest('hex');

    const body = new URLSearchParams();
    body.append('file', imageData);
    body.append('api_key', credentials.apiKey);
    body.append('timestamp', String(timestamp));
    body.append('folder', folder);
    body.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/upload`, {
        method: 'POST',
        body: body
    });

    const data = await response.json();
    if (!response.ok) {
        console.error("Cloudinary Error Response:", data);
        throw new Error(data?.error?.message || 'Image upload failed.');
    }

    return { url: data.secure_url, publicId: data.public_id };
};

const deleteImageFromCloudinary = async (publicId) => {
    if (!publicId) return;
    const credentials = parseCloudinaryUrl();
    if (!credentials) return;

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
        method: 'POST', body
    });
};

const buildStatusFilter = (status) => {
    if (status === 'returned') return { status: 'returned' };
    if (status === 'active') return { status: { $in: ACTIVE_STATUSES } };
    return {};
};

const populateItemQuery = (query) => query.populate('postedBy', 'realName nickname email studentId');

const firstNonEmptyDateField = (body) => {
    const candidates = [body.eventDate, body.foundDate, body.lostDate, body.date];
    for (const v of candidates) {
        if (v !== undefined && v !== null && v !== '') return v;
    }
    return undefined;
};

const parseIncidentDate = (body) => {
    const raw = firstNonEmptyDateField(body);
    if (raw === undefined) return { error: 'MISSING', date: null };
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return { error: 'INVALID', date: null };
    return { error: null, date: d };
};

const isIncidentDateInFuture = (d) => {
    const now = new Date();
    const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const inputUTC = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    return inputUTC > todayUTC;
};

const sanitizeItemPayload = (body) => ({
    title: body.title?.trim(),
    description: body.description?.trim(),
    type: body.type,
    category: body.category?.trim(),
    location: body.location?.trim()
});

const validateItemPayload = (payload, options = {}) => {
    const { incidentDate } = options;
    if (!payload.title || !payload.description || !payload.type || !payload.category || !payload.location) {
        return 'Title, description, type, category, and location are required.';
    }
    if (!['lost', 'found'].includes(payload.type)) return 'Type must be either lost or found.';
    if (!ALLOWED_ITEM_CATEGORIES.includes(payload.category)) return 'Please choose a valid category from the list.';
    if (!incidentDate) return payload.type === 'found' ? 'Date found is required.' : 'Date lost is required.';
    if (isIncidentDateInFuture(incidentDate)) return 'Date must be today or in the past, not in the future.';
    return null;
};

const canManageItem = (item, userId) => String(item.postedBy?._id || item.postedBy) === String(userId);

// AI Image Tagging with Error Handling
const getAIImageTags = async (imageUrl) => {
    if (!imageUrl) return [];
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = "Analyze this image and list exactly 5 specific keywords about the main object (color, brand, material, type) for a lost and found system. Return ONLY the keywords separated by commas, nothing else (e.g., 'black, samsung, phone, plastic, electronic').";
        
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        const contentType = response.headers.get("content-type") || "image/jpeg";

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Data,
                    mimeType: contentType
                }
            },
            { text: prompt }
        ]);

        const tagsText = result.response.text();
        console.log("🚀 AI Raw Response:", tagsText);

        return tagsText.split(/[,\n]/)
            .map(tag => tag.trim().toLowerCase().replace(/[^a-z0-9\s]/gi, ''))
            .filter(tag => tag.length > 0)
            .slice(0, 5);
            
    } catch (error) {
        console.error("❌ AI Tagging Error:", error.message);
        return []; // AI fail unath system eka continue wenawa
    }
};

// Helper function to extract meaningful words from description
const extractKeywords = (text) => {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'this', 'that', 'it', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had'];
    return text.toLowerCase()
        .split(/\W+/)
        .filter(word => word.length > 3 && !stopWords.includes(word));
};

// Calculate text similarity score
const calculateTextMatchScore = (desc1, desc2) => {
    const words1 = extractKeywords(desc1);
    const words2 = extractKeywords(desc2);
    const commonWords = words1.filter(word => words2.includes(word));
    return Math.min(commonWords.length * 8, 30); // Max 30 points
};

// Calculate location match score
const calculateLocationScore = (loc1, loc2) => {
    return loc1.toLowerCase() === loc2.toLowerCase() ? 25 : 0;
};

// Calculate date score (within 7 days window)
const calculateDateScore = (date1, date2) => {
    const dayDiff = Math.abs(new Date(date1) - new Date(date2)) / (1000 * 60 * 60 * 24);
    return dayDiff <= 7 ? 25 : 0;
};

// Calculate AI tags match score
const calculateAITagsScore = (tags1, tags2) => {
    if (!tags1 || !tags2 || tags1.length === 0 || tags2.length === 0) return 0;
    const commonTags = tags1.filter(tag => tags2.includes(tag));
    return Math.min(commonTags.length * 15, 35); // Max 35 points
};

// Send notification (implement based on your notification system)
const sendMatchNotification = async (userId, itemId, notificationType) => {
    if (!userId) {
        console.error("❌ Cannot send notification: userId is missing");
        return false;
    }
    
    try {
        // Implement your notification logic here
        console.log(`📧 Notification sent to user ${userId}: ${notificationType} for item ${itemId}`);
        
        // If you have a Notification model:
        // await Notification.create({
        //     userId: userId,
        //     itemId: itemId,
        //     type: notificationType,
        //     message: notificationType === 'owner_found' 
        //         ? "Owner found, check it to confirm!" 
        //         : "Your item is found, check it to confirm!",
        //     read: false,
        //     createdAt: new Date()
        // });
        
        return true;
    } catch (error) {
        console.error("❌ Notification error:", error.message);
        return false;
    }
};

exports.createItem = async (req, res) => {
    try {
        const payload = sanitizeItemPayload(req.body);
        const parsed = parseIncidentDate(req.body);
        if (parsed.error === 'INVALID') return res.status(400).json({ message: 'Invalid date. Use a valid calendar date.' });
        
        const validationError = validateItemPayload(payload, { incidentDate: parsed.date });
        if (validationError) return res.status(400).json({ message: validationError });

        let imageUpload = null;
        let aiTags = [];

        // Image upload and AI Tagging (AI error unath system eka continue wenawa)
        if (req.body.imageData) {
            try {
                imageUpload = await uploadImageToCloudinary(req.body.imageData);
                if (imageUpload && imageUpload.url) {
                    aiTags = await getAIImageTags(imageUpload.url);
                    console.log("✅ Generated AI Tags:", aiTags);
                }
            } catch (uploadError) {
                console.error("Image upload/AI tagging failed:", uploadError.message);
                // Continue without image/AI tags
            }
        }

        const posterId = req.user.id || req.user._id;
        if (!posterId) return res.status(403).json({ message: 'Posting items requires a user id in the token.' });

        const newItem = await Item.create({
            ...payload,
            date: parsed.date,
            image: imageUpload?.url || null,
            imagePublicId: imageUpload?.publicId || null,
            imageTags: aiTags, 
            postedBy: posterId,
            status: 'active'
        });

        const savedItem = await populateItemQuery(Item.findById(newItem._id));

        // Find matching items of opposite type with same category
        const oppositeType = savedItem.type === 'lost' ? 'found' : 'lost';
        const candidates = await populateItemQuery(Item.find({
            type: oppositeType,
            category: savedItem.category,
            status: { $in: ACTIVE_STATUSES },
            _id: { $ne: savedItem._id }
        }));

        let foundMatches = [];

        // Calculate match scores for each candidate
        for (const match of candidates) {
            let matchScore = 0;
            
            // 1. Date match (within 7 days) - 25 points
            matchScore += calculateDateScore(match.date, savedItem.date);
            
            // 2. Location match - 25 points
            matchScore += calculateLocationScore(match.location, savedItem.location);
            
            // 3. Description text match - Max 30 points
            matchScore += calculateTextMatchScore(savedItem.description, match.description);
            
            // 4. AI Tags match - Max 35 points
            matchScore += calculateAITagsScore(savedItem.imageTags, match.imageTags);
            
            // If score is 45 or more, consider it a match
            if (matchScore >= 45) {
                foundMatches.push({
                    item: match,
                    score: matchScore,
                    commonFeatures: {
                        dateMatch: calculateDateScore(match.date, savedItem.date) >= 25,
                        locationMatch: calculateLocationScore(match.location, savedItem.location) >= 25,
                        commonWords: extractKeywords(savedItem.description)
                            .filter(word => extractKeywords(match.description).includes(word)),
                        commonAITags: savedItem.imageTags.filter(tag => 
                            match.imageTags && match.imageTags.includes(tag)
                        )
                    }
                });
            }
        }

        // Sort matches by score (highest first)
        foundMatches.sort((a, b) => b.score - a.score);

        // Send notifications if matches found
        if (foundMatches.length > 0) {
            savedItem.matchedWith = foundMatches[0].item._id;
            await savedItem.save();
            
            // Send notification to current poster (with safe ID extraction)
            const currentUserId = savedItem.postedBy?._id || savedItem.postedBy;
            if (currentUserId) {
                await sendMatchNotification(
                    currentUserId, 
                    savedItem._id, 
                    savedItem.type === 'lost' ? 'item_found' : 'owner_found'
                );
            }
            
            // Send notification to matched item poster (with safe ID extraction)
            const matchedItem = foundMatches[0].item;
            const matchedUserId = matchedItem.postedBy?._id || matchedItem.postedBy;
            if (matchedUserId) {
                await sendMatchNotification(
                    matchedUserId, 
                    matchedItem._id, 
                    matchedItem.type === 'lost' ? 'item_found' : 'owner_found'
                );
            }
            
            console.log(`✅ Found ${foundMatches.length} matches for item ${savedItem._id}`);
        }

        // Prepare response message
        let responseMessage = "Item reported successfully.";
        if (foundMatches.length > 0) {
            responseMessage = savedItem.type === 'lost' 
                ? `🎉 Your item is found! ${foundMatches.length} potential match${foundMatches.length > 1 ? 'es' : ''} found. Check it to confirm!` 
                : `🎉 Owner found! ${foundMatches.length} potential match${foundMatches.length > 1 ? 'es' : ''} found. Check it to confirm!`;
        }

        return res.status(201).json({
            message: responseMessage,
            item: savedItem,
            matchFound: foundMatches.length > 0,
            matches: foundMatches
        });

    } catch (error) {
        console.error("❌ Create Item Error:", error);
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
        console.error("Get Items Error:", error);
        return res.status(500).json({ message: 'Failed to fetch items.' });
    }
};

exports.getItemById = async (req, res) => {
    try {
        const item = await populateItemQuery(Item.findById(req.params.id));
        if (!item) return res.status(404).json({ message: 'Item not found.' });
        return res.status(200).json({ item });
    } catch (error) {
        console.error("Get Item Error:", error);
        return res.status(500).json({ message: 'Failed to fetch item.' });
    }
};

exports.updateItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found.' });
        if (!canManageItem(item, req.user.id)) return res.status(403).json({ message: 'Only the post author can update this item.' });

        const mergedBody = { ...item.toObject(), ...req.body };
        const payload = sanitizeItemPayload(mergedBody);
        const parsed = parseIncidentDate(mergedBody);
        if (parsed.error === 'INVALID') return res.status(400).json({ message: 'Invalid date. Use a valid calendar date.' });
        
        const incidentDate = parsed.error === 'MISSING' ? item.date : parsed.date;
        const validationError = validateItemPayload(payload, { incidentDate });
        if (validationError) return res.status(400).json({ message: validationError });

        if (req.body.imageData) {
            try {
                const uploadedImage = await uploadImageToCloudinary(req.body.imageData);
                if (item.imagePublicId) await deleteImageFromCloudinary(item.imagePublicId);
                item.image = uploadedImage.url;
                item.imagePublicId = uploadedImage.publicId;
                
                // Update AI tags with error handling
                const newTags = await getAIImageTags(uploadedImage.url);
                item.imageTags = newTags;
            } catch (uploadError) {
                console.error("Image update failed:", uploadError.message);
                // Continue without updating image/AI tags
            }
        }

        item.title = payload.title;
        item.description = payload.description;
        item.type = payload.type;
        item.category = payload.category;
        item.location = payload.location;
        if (parsed.date) item.date = parsed.date;

        await item.save();

        const updatedItem = await populateItemQuery(Item.findById(item._id));
        return res.status(200).json({ message: 'Item updated successfully.', item: updatedItem });
    } catch (error) {
        console.error("Update Item Error:", error);
        return res.status(500).json({ message: error.message || 'Failed to update item.' });
    }
};

exports.markItemAsReturned = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found.' });
        if (!canManageItem(item, req.user.id)) return res.status(403).json({ message: 'Only the post author can mark this item as returned.' });

        item.status = 'returned';
        await item.save();

        const updatedItem = await populateItemQuery(Item.findById(item._id));
        return res.status(200).json({ message: 'Item marked as returned.', item: updatedItem });
    } catch (error) {
        console.error("Mark Returned Error:", error);
        return res.status(500).json({ message: 'Failed to update item status.' });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found.' });
        if (!canManageItem(item, req.user.id)) return res.status(403).json({ message: 'Only the post author can delete this item.' });
        if (item.status !== 'returned') return res.status(400).json({ message: 'Only returned items can be deleted.' });

        await deleteImageFromCloudinary(item.imagePublicId);
        await item.deleteOne();

        return res.status(200).json({ message: 'Returned item deleted successfully.' });
    } catch (error) {
        console.error("Delete Item Error:", error);
        return res.status(500).json({ message: 'Failed to delete item.' });
    }
};