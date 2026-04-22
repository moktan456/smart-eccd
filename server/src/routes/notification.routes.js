const express = require('express');
const router = express.Router();
const { getNotifications, markRead, markAllRead } = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/', getNotifications);
router.patch('/:id/read', markRead);
router.patch('/read-all', markAllRead);

module.exports = router;
