const User = require('../models/User');
const Item = require('../models/Item');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const ADMIN_EMAIL = 'admin@my.sliit.lk';
const ADMIN_PASSWORD = '123456';

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

// Check if Student ID, Email or Nickname already exists
exports.checkExisting = async (req, res) => {
    try {
        const { field, value } = req.body;

        if (!value || value.trim() === "") {
            return res.status(400).json({ message: "Input cannot be empty" });
        }

        if (field === 'email' && normalizeEmail(value) === normalizeEmail(ADMIN_EMAIL)) {
            return res.status(400).json({
                exists: true,
                message: 'This email address is reserved.',
            });
        }

        const user = await User.findOne({ [field]: value });

        if (user) {
            let errorMessage = "";
            if (field === 'studentId') {
                errorMessage = "This Student ID is already registered.";
            } else if (field === 'email') {
                errorMessage = "This Email address is already registered.";
            } else if (field === 'nickname') {
                errorMessage = "Sorry! This nickname is already taken.";
            }

            return res.status(400).json({
                exists: true,
                message: errorMessage
            });
        }

        res.status(200).json({ exists: false });
    } catch (err) {
        console.error("Validation Error:", err);
        res.status(500).json({ message: "Server error during validation." });
    }
};

// Final Registration
exports.register = async (req, res) => {
    try {
        const { studentId, realName, email, nickname, password } = req.body;

        if (normalizeEmail(email) === normalizeEmail(ADMIN_EMAIL)) {
            return res.status(400).json({ message: 'This email is reserved for administrator access.' });
        }

        const existingUser = await User.findOne({ 
            $or: [{ email }, { studentId }, { nickname }] 
        });

        if (existingUser) {
            return res.status(400).json({ message: "One of the details (ID, Email, or Nickname) is already registered." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            studentId,
            realName,
            email: normalizeEmail(email),
            nickname,
            password: hashedPassword
        });

        await newUser.save();
        res.status(201).json({ message: "User registered successfully!" });

    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).json({ message: "Server error during registration." });
    }
};

// Get stats for dashboard
exports.getStats = async (req, res) => {
    try {
        const reported = await Item.countDocuments();
        const returned = await Item.countDocuments({ status: 'returned' });
        const pending = await Item.countDocuments({ status: 'pending' });
        const totalUsers = await User.countDocuments();

        const trustScoreValue = reported > 0 ? Math.round((returned / reported) * 100) : 0;

        res.status(200).json({
            reported,
            returned,
            trustScore: `${trustScoreValue}%`,
            events: pending,
            users: totalUsers
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching statistics." });
    }
};

/**
 * Admin: hardcoded credentials (no registration).
 * User: registered students — JWT includes role: "user".
 */
exports.login = async (req, res) => {
    try {
        const emailRaw = req.body?.email;
        const passwordRaw = req.body?.password;
        const email = emailRaw != null ? String(emailRaw).trim() : '';
        const password = passwordRaw != null ? String(passwordRaw) : '';

        const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'dev_jwt_secret_change_me' : null);

        if (!jwtSecret) {
            console.error('Login Error: JWT_SECRET is not configured.');
            return res.status(500).json({ message: 'Server configuration error. Please contact support.' });
        }

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const emailOk = normalizeEmail(email) === normalizeEmail(ADMIN_EMAIL);
        const passwordOk = password === ADMIN_PASSWORD;

        if (emailOk && passwordOk) {
            const token = jwt.sign(
                { email: ADMIN_EMAIL, role: 'admin' },
                jwtSecret,
                { expiresIn: '7d' }
            );

            return res.status(200).json({
                message: 'Login successful',
                token,
                role: 'admin',
                email: ADMIN_EMAIL,
                user: {
                    email: ADMIN_EMAIL,
                    role: 'admin',
                    nickname: 'Admin',
                    realName: 'Administrator',
                    studentId: '—',
                },
            });
        }

        const user = await User.findOne({
            $or: [{ email: normalizeEmail(email) }, { email: email.trim() }],
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            {
                id: user._id.toString(),
                email: user.email,
                role: 'user',
                nickname: user.nickname,
            },
            jwtSecret,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            message: 'Login successful',
            token,
            role: 'user',
            email: user.email,
            user: {
                id: user._id,
                studentId: user.studentId,
                realName: user.realName,
                email: user.email,
                nickname: user.nickname,
                role: 'user',
            },
        });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ message: 'Server error during login.' });
    }
};