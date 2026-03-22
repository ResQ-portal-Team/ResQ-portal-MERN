const jwt = require('jsonwebtoken');

function getJwtSecret() {
    return process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'dev_jwt_secret_change_me' : null);
}

function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization || '';

        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authentication required.' });
        }

        const jwtSecret = getJwtSecret();
        if (!jwtSecret) {
            return res.status(500).json({ message: 'JWT secret is not configured.' });
        }

        const token = authHeader.replace('Bearer ', '');
        req.user = jwt.verify(token, jwtSecret);
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
}

function requireAdmin(req, res, next) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required.' });
    }
    next();
}

module.exports = { authenticate, requireAdmin, getJwtSecret };
