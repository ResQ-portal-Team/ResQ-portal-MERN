const express = require('express');
const jwt = require('jsonwebtoken');
const { authenticate, getJwtSecret } = require('../middleware/authMiddleware');
const contactController = require('../controllers/contactController');

const router = express.Router();

// Optional auth middleware: if Bearer present and valid, attaches req.user; otherwise continues without error.
function optionalAuthenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return next();
    }
    const jwtSecret = getJwtSecret();
    if (!jwtSecret) {
      return next();
    }
    const token = authHeader.replace('Bearer ', '');
    req.user = jwt.verify(token, jwtSecret);
  } catch (_e) {
    // ignore token errors for optional auth
  }
  next();
}

// Public submit (auth optional)
router.post('/', optionalAuthenticate, contactController.create);
router.get('/my-notifications', authenticate, contactController.myResolvedNotifications);
router.patch('/my-notifications/:id/seen', authenticate, contactController.markNotificationSeen);

module.exports = router;
