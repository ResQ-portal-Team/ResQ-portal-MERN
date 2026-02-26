const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

/**
 * @route   POST api/auth/check-existing
 * @desc    Check if Student ID, Email or Nickname already exists (Real-time validation)
 */
router.post('/check-existing', async (req, res) => {
    try {
        const { field, value } = req.body; 
        
        // database එකේ අදාළ field එකේ මේ value එක තියෙනවද බලනවා
        const user = await User.findOne({ [field]: value });
        
        if (user) {
            // field එක අනුව අදාළ message එක තීරණය කරනවා
            let errorMessage = "";
            if (field === 'studentId') {
                errorMessage = "This Student ID is already registered.";
            } else if (field === 'email') {
                errorMessage = "This Email address is already registered.";
            } else if (field === 'nickname') {
                //  nickname එකට අදාළ message එක
                errorMessage = "Sorry! This nickname is already taken.";
            }

            return res.status(400).json({ 
                exists: true, 
                message: errorMessage 
            });
        }
        
        // කිසිම යූසර් කෙනෙක් නැත්නම් success ප්‍රතිචාරයක් යවනවා
        res.status(200).json({ exists: false });
    } catch (err) {
        console.error("Validation Error:", err);
        res.status(500).json("Server error during validation.");
    }
});

/**
 * @route   POST api/auth/register
 * @desc    Final Registration after all bot steps
 */
router.post('/register', async (req, res) => {
    try {
        const { studentId, realName, email, nickname, password } = req.body;

        // අවසන් පියවරේදීත් ආරක්ෂාව සඳහා නැවත වරක් database එක check කරනවා
        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.status(400).json("This email is already registered.");

        const existingID = await User.findOne({ studentId });
        if (existingID) return res.status(400).json("This Student ID is already registered.");

        const existingNickname = await User.findOne({ nickname });
        if (existingNickname) return res.status(400).json("This Nickname is already taken.");

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
        res.status(201).json("User registered successfully!");

    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).json("Server error during registration.");
    }
});

/**
 * @route   GET api/auth/stats
 * @desc    Get real data for dashboard cards
 */
router.get('/stats', async (req, res) => {
    try {
        const reportedCount = 0; 
        const returnedCount = 0; 

        res.status(200).json({
            reported: reportedCount,
            returned: returnedCount,
            trustScore: "95%",
            events: 5
        });
    } catch (err) {
        res.status(500).json("Error fetching statistics.");
    }
});

module.exports = router;