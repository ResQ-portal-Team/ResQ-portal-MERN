const User = require('../models/User');
const Item = require('../models/Item');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Check if Student ID, Email or Nickname already exists
exports.checkExisting = async (req, res) => {
    try {
        const { field, value } = req.body;

        if (!value || value.trim() === "") {
            return res.status(400).json({ message: "Input cannot be empty" });
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
            email,
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

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV !== "production" ? "dev_jwt_secret_change_me" : null);

        if (!jwtSecret) {
            console.error("Login Error: JWT_SECRET is not configured.");
            return res.status(500).json({ message: "Server configuration error. Please contact support." });
        }

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, nickname: user.nickname },
            jwtSecret,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                studentId: user.studentId,
                realName: user.realName,
                email: user.email,
                nickname: user.nickname
            }
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Server error during login." });
    }
};