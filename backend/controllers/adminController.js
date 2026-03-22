const crypto = require('crypto');
const User = require('../models/User');
const Item = require('../models/Item');

const ADMIN_EMAIL = 'admin@my.sliit.lk';

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

const parseCloudinaryUrl = () => {
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    if (!cloudinaryUrl) return null;
    const parsedUrl = new URL(cloudinaryUrl);
    return {
        cloudName: parsedUrl.hostname,
        apiKey: parsedUrl.username,
        apiSecret: parsedUrl.password,
    };
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
        signature,
    });

    await fetch(`https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/destroy`, {
        method: 'POST',
        body,
    });
};

exports.listUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ _id: -1 })
            .lean();
        res.status(200).json({ users });
    } catch (err) {
        console.error('admin listUsers:', err);
        res.status(500).json({ message: 'Failed to load users.' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        if (normalizeEmail(user.email) === normalizeEmail(ADMIN_EMAIL)) {
            return res.status(400).json({ message: 'Cannot delete the administrator account.' });
        }
        const userItems = await Item.find({ postedBy: user._id });
        for (const it of userItems) {
            await deleteImageFromCloudinary(it.imagePublicId);
        }
        await Item.deleteMany({ postedBy: user._id });
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (err) {
        console.error('admin deleteUser:', err);
        res.status(500).json({ message: 'Failed to delete user.' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { realName, nickname, studentId } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        if (normalizeEmail(user.email) === normalizeEmail(ADMIN_EMAIL)) {
            return res.status(400).json({ message: 'Cannot modify the administrator account.' });
        }

        if (studentId !== undefined && studentId !== user.studentId) {
            const taken = await User.findOne({ studentId: String(studentId).trim(), _id: { $ne: user._id } });
            if (taken) {
                return res.status(400).json({ message: 'Student ID already in use.' });
            }
            user.studentId = String(studentId).trim();
        }
        if (nickname !== undefined && nickname !== user.nickname) {
            const taken = await User.findOne({ nickname: String(nickname).trim(), _id: { $ne: user._id } });
            if (taken) {
                return res.status(400).json({ message: 'Nickname already taken.' });
            }
            user.nickname = String(nickname).trim();
        }
        if (realName !== undefined) {
            user.realName = String(realName).trim();
        }

        await user.save();
        const updated = await User.findById(user._id).select('-password').lean();
        res.status(200).json({ message: 'User updated.', user: updated });
    } catch (err) {
        console.error('admin updateUser:', err);
        res.status(500).json({ message: 'Failed to update user.' });
    }
};

const populateItemQuery = (query) => query.populate('postedBy', 'realName nickname email studentId');

exports.listItems = async (req, res) => {
    try {
        const items = await populateItemQuery(Item.find().sort({ createdAt: -1 }));
        res.status(200).json({ items });
    } catch (err) {
        console.error('admin listItems:', err);
        res.status(500).json({ message: 'Failed to load items.' });
    }
};

exports.adminDeleteItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found.' });
        }
        await deleteImageFromCloudinary(item.imagePublicId);
        await item.deleteOne();
        res.status(200).json({ message: 'Item deleted successfully.' });
    } catch (err) {
        console.error('admin adminDeleteItem:', err);
        res.status(500).json({ message: 'Failed to delete item.' });
    }
};
