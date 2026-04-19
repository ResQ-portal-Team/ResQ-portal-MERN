const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');
const itemsController = require('../controllers/itemsController');
const communityEventController = require('../controllers/communityEventController');
const contactController = require('../controllers/contactController');
const eventPollController = require('../controllers/eventPollController');

const router = express.Router();

/** Public health check (no auth) — use to verify /api/admin is mounted */
router.get('/health', (req, res) => {
  res.status(200).json({ ok: true, message: 'Admin API mounted' });
});

router.get('/users', authenticate, requireAdmin, adminController.listUsers);
router.delete('/users/:id', authenticate, requireAdmin, adminController.deleteUser);
router.patch('/users/:id', authenticate, requireAdmin, adminController.updateUser);

router.get('/items', authenticate, requireAdmin, adminController.listItems);
/** Admin replace item photo — prefer this path (avoids some Express/path issues with `/items/:id/image`). */
router.patch('/item-image/:id', authenticate, requireAdmin, itemsController.adminPatchItemImage);
router.post('/item-image/:id', authenticate, requireAdmin, itemsController.adminPatchItemImage);
/** Legacy URL — kept for older frontends */
router.patch(
  '/items/:id/image',
  authenticate,
  requireAdmin,
  itemsController.adminPatchItemImage
);
router.post(
  '/items/:id/image',
  authenticate,
  requireAdmin,
  itemsController.adminPatchItemImage
);
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

router.get('/event-polls/summary', authenticate, requireAdmin, eventPollController.listSummary);
router.get('/event-polls/:eventId', authenticate, requireAdmin, eventPollController.detail);

// Contact messages management
router.get('/contacts', authenticate, requireAdmin, contactController.adminList);
router.patch('/contacts/:id/resolve', authenticate, requireAdmin, contactController.adminResolve);
router.delete('/contacts/:id', authenticate, requireAdmin, contactController.adminDelete);

module.exports = router;
