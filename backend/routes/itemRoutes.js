const express = require('express');
const itemController = require('../controllers/itemController');

const router = express.Router();
router.get('/', itemController.getItems);
router.post('/add', itemController.createItem);
router.patch('/:id/return', itemController.markItemAsReturned);

module.exports = router;
