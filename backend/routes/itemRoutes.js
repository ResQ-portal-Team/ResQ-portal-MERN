const express = require('express');
const jwt = require('jsonwebtoken');
const itemsController = require('../controllers/itemsController');

const router = express.Router();

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';

        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authentication required.' });
        }

        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            return res.status(500).json({ message: 'JWT secret is not configured.' });
        }

        const token = authHeader.replace('Bearer ', '');
        req.user = jwt.verify(token, jwtSecret);
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

router.get('/', itemsController.getItems);
router.get('/:id', itemsController.getItemById);
router.post('/', authenticate, itemsController.createItem);
router.post('/add', authenticate, itemsController.createItem);
router.put('/:id', authenticate, itemsController.updateItem);
router.patch('/:id/return', authenticate, itemsController.markItemAsReturned);
router.delete('/:id', authenticate, itemsController.deleteItem);

module.exports = router;
