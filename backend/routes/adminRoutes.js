const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');
const communityEventController = require('../controllers/communityEventController');

const router = express.Router();

/** Public health check (no auth) — use to verify /api/admin is mounted */
router.get('/health', (req, res) => {
  res.status(200).json({ ok: true, message: 'Admin API mounted' });
});

router.get('/users', authenticate, requireAdmin, adminController.listUsers);
router.delete('/users/:id', authenticate, requireAdmin, adminController.deleteUser);
router.patch('/users/:id', authenticate, requireAdmin, adminController.updateUser);

router.get('/items', authenticate, requireAdmin, adminController.listItems);
router.delete('/items/:id', authenticate, requireAdmin, adminController.adminDeleteItem);

router.get('/community-events', authenticate, requireAdmin, communityEventController.list);
router.post('/community-events', authenticate, requireAdmin, communityEventController.create);
router.patch('/community-events/:id', authenticate, requireAdmin, communityEventController.update);
router.patch(
  '/community-events/:id/mark-finished',
  authenticate,
  requireAdmin,
  communityEventController.markFinished
);
router.delete('/community-events/:id', authenticate, requireAdmin, communityEventController.remove);

module.exports = router;
