const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Item = require('../models/Item');
const PasswordReset = require('../models/PasswordReset');
const AdminSettings = require('../models/AdminSettings');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendPasswordResetOtp, getMailCredentials } = require('../utils/sendMail');

function envTruthy(name, defaultIfUnset = false) {
    const raw = process.env[name];
    if (raw === undefined || raw === '') {
        return defaultIfUnset;
    }
    return ['1', 'true', 'yes', 'on'].includes(String(raw).trim().replace(/\r$/, '').toLowerCase());
}

function showOtpInApiResponse() {
    return envTruthy('RESQ_SHOW_OTP_IN_RESPONSE', false);
}

/** Include otp in JSON when flag is on, or whenever not in production (typical local npm start). */
function shouldRevealOtpInResponse() {
    return showOtpInApiResponse() || process.env.NODE_ENV !== 'production';
}

const ADMIN_EMAIL = 'qwe730375@gmail.com';
const ADMIN_PASSWORD = '123456';

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function escapeRegex(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive user lookup (works on older MongoDB; avoids $expr/$trim issues). */
function findUserByEmailLoose(emailNorm) {
    if (!emailNorm) {
        return Promise.resolve(null);
    }
    return User.findOne({
        email: new RegExp(`^${escapeRegex(emailNorm)}$`, 'i'),
    });
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

        let user;
        if (field === 'email') {
            user = await findUserByEmailLoose(normalizeEmail(value));
        } else {
            user = await User.findOne({ [field]: value });
        }

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

        const emailNorm = normalizeEmail(email);
        const existingUser = await User.findOne({
            $or: [
                { email: new RegExp(`^${escapeRegex(emailNorm)}$`, 'i') },
                { studentId },
                { nickname },
            ],
        });

        if (existingUser) {
            return res.status(400).json({ message: "One of the details (ID, Email, or Nickname) is already registered." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            studentId,
            realName,
            email: emailNorm,
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
        let passwordOk = false;
        if (emailOk) {
            const adminDoc = await AdminSettings.findById('admin').lean();
            if (adminDoc?.passwordHash) {
                passwordOk = await bcrypt.compare(password, adminDoc.passwordHash);
            } else {
                passwordOk = password === ADMIN_PASSWORD;
            }
        }

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

        const user = await findUserByEmailLoose(normalizeEmail(email));

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

/** GET — safe flags for debugging forgot-password / OTP (no secrets). */
exports.publicAuthConfig = (req, res) => {
    const { user: u, pass: p } = getMailCredentials();
    res.status(200).json({
        showOtpInApiResponse: showOtpInApiResponse(),
        shouldRevealOtpInResponse: shouldRevealOtpInResponse(),
        emailSenderConfigured: Boolean(u && p),
        mongoReady: mongoose.connection.readyState === 1,
        nodeEnv: process.env.NODE_ENV || '(unset)',
    });
};

/** Request OTP emailed to the account address (registered students or admin email). */
exports.forgotPassword = async (req, res) => {
    try {
        const emailRaw = req.body?.email;
        console.log('[forgot-password] POST body:', req.body);
        const emailNorm = emailRaw != null ? normalizeEmail(emailRaw) : '';
        if (!emailNorm) {
            return res.status(400).json({ message: 'Email is required.' });
        }

        const isAdmin = emailNorm === normalizeEmail(ADMIN_EMAIL);
        const user = await findUserByEmailLoose(emailNorm);

        if (!isAdmin && !user) {
            console.warn('[forgot-password] NO ACCOUNT in MongoDB for:', emailNorm);
            return res.status(404).json({
                message:
                    'No account found for this email. Register first on the onboarding page using this exact address, then try again.',
                code: 'NO_ACCOUNT',
                hint: 'Open Register / Onboarding, create the user, then use Forgot password.',
            });
        }

        const { user: mailUser, pass: mailPass } = getMailCredentials();
        if (!mailUser || !mailPass) {
            console.error('Forgot password: EMAIL_USER or EMAIL_PASS missing after dotenv load.');
            return res.status(500).json({
                message: 'Server email is not configured. Add EMAIL_USER and EMAIL_PASS to backend/.env and restart.',
            });
        }

        const otp = String(crypto.randomInt(100000, 1000000));
        if (shouldRevealOtpInResponse()) {
            console.log(`[forgot-password] OTP for ${emailNorm} = ${otp} (included in JSON while not in production or when RESQ_SHOW_OTP_IN_RESPONSE=1)`);
        }
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await PasswordReset.findOneAndUpdate(
            { email: emailNorm },
            { email: emailNorm, otpHash, expiresAt },
            { upsert: true, new: true }
        );

        /** Always mail the address the user typed (normalized). From-address is EMAIL_USER (e.g. qwe730375@gmail.com). */
        const deliverTo = emailNorm;

        console.log('[forgot-password] SMTP from', mailUser, 'to', deliverTo, { isAdmin, registeredUser: Boolean(user) });

        let mailError = null;
        try {
            await sendPasswordResetOtp(deliverTo, otp);
        } catch (err) {
            mailError = err;
            console.error('[forgot-password] sendMail failed:', err.message || err);
        }

        const payload = {
            message: mailError
                ? 'Could not send the email. Please try again in a moment.'
                : 'Check your email for the verification code (including Spam).',
            sentFrom: mailUser,
            sentTo: deliverTo,
        };
        if (shouldRevealOtpInResponse()) {
            payload.otp = String(otp);
            payload.demoMode = true;
            if (mailError) {
                payload.message = 'Email could not be sent. Use the code filled in below, or try again.';
            }
            console.warn('[forgot-password] OTP exposed in JSON (local dev or RESQ_SHOW_OTP_IN_RESPONSE).');
        } else if (mailError) {
            return res.status(502).json({
                message:
                    'Could not send email via Gmail. Check EMAIL_USER / app password, network allows SMTP port 587 or 465, or set RESQ_SHOW_OTP_IN_RESPONSE=1 in backend/.env for local testing. Details: '
                    + (mailError.message || 'unknown'),
                sentFrom: mailUser,
                sentTo: deliverTo,
            });
        }

        return res.status(200).json(payload);
    } catch (err) {
        console.error('Forgot password error:', err.message || err);
        let msg = 'Could not send verification code. Try again later.';
        if (err.message && err.message.includes('Email is not configured')) {
            msg = 'Email is not configured on the server.';
        } else if (process.env.NODE_ENV !== 'production' && err.message) {
            msg = `Could not send email: ${err.message}`;
        }
        return res.status(500).json({ message: msg });
    }
};

/** Check OTP only (before showing new-password fields). Does not change password or delete the reset record. */
exports.verifyResetOtp = async (req, res) => {
    try {
        const emailNorm = normalizeEmail(req.body?.email);
        const otp = req.body?.otp != null ? String(req.body.otp).trim() : '';

        if (!emailNorm || !otp) {
            return res.status(400).json({ message: 'Email and verification code are required.' });
        }
        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({ message: 'Enter the 6-digit code from your email.' });
        }

        const pr = await PasswordReset.findOne({ email: emailNorm });
        if (!pr || pr.expiresAt.getTime() < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired code. Request a new code from the previous step.' });
        }

        const otpMatch = await bcrypt.compare(otp, pr.otpHash);
        if (!otpMatch) {
            return res.status(400).json({ message: 'Wrong verification code. Check your email and try again.' });
        }

        return res.status(200).json({ ok: true, message: 'Code verified. You can set a new password.' });
    } catch (err) {
        console.error('verifyResetOtp error:', err);
        return res.status(500).json({ message: 'Could not verify code.' });
    }
};

/** Verify OTP and set a new password (student in DB or persisted admin hash). */
exports.resetPassword = async (req, res) => {
    try {
        const emailRaw = req.body?.email;
        const otpRaw = req.body?.otp;
        const newPasswordRaw = req.body?.newPassword;

        const emailNorm = emailRaw != null ? normalizeEmail(emailRaw) : '';
        const otp = otpRaw != null ? String(otpRaw).trim() : '';
        const newPassword = newPasswordRaw != null ? String(newPasswordRaw) : '';

        if (!emailNorm || !otp || !newPassword) {
            return res.status(400).json({ message: 'Email, code, and new password are required.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters.' });
        }
        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({ message: 'Enter the 6-digit code from your email.' });
        }

        const pr = await PasswordReset.findOne({ email: emailNorm });
        if (!pr || pr.expiresAt.getTime() < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired code. Request a new one.' });
        }

        const otpMatch = await bcrypt.compare(otp, pr.otpHash);
        if (!otpMatch) {
            return res.status(400).json({ message: 'Invalid verification code.' });
        }

        const isAdmin = emailNorm === normalizeEmail(ADMIN_EMAIL);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        if (isAdmin) {
            await AdminSettings.findOneAndUpdate(
                { _id: 'admin' },
                { _id: 'admin', passwordHash: hashedPassword },
                { upsert: true, new: true }
            );
        } else {
            const user = await findUserByEmailLoose(emailNorm);
            if (!user) {
                await PasswordReset.deleteOne({ email: emailNorm });
                return res.status(404).json({ message: 'No account found with this email.' });
            }
            user.password = hashedPassword;
            await user.save();
        }

        await PasswordReset.deleteOne({ email: emailNorm });
        return res.status(200).json({ message: 'Password updated. You can sign in now.' });
    } catch (err) {
        console.error('Reset password error:', err);
        return res.status(500).json({ message: 'Could not reset password.' });
    }
};