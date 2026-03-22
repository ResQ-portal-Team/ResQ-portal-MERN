const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const itemsController = require('../controllers/itemsController');

const router = express.Router();

router.get('/', itemsController.getItems);
router.get('/:id', itemsController.getItemById);
router.post('/', authenticate, itemsController.createItem);
router.post('/add', authenticate, itemsController.createItem);
router.put('/:id', authenticate, itemsController.updateItem);
router.patch('/:id/return', authenticate, itemsController.markItemAsReturned);
router.delete('/:id', authenticate, itemsController.deleteItem);

module.exports = router;
