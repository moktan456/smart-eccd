const express = require('express');
const router = express.Router();
const { getNotifications, markRead, markAllRead, broadcast, getSent } = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(authenticate);
router.get('/',           getNotifications);
router.get('/sent',       authorize('notification:write'), getSent);
router.patch('/:id/read', markRead);
router.patch('/read-all', markAllRead);
router.post('/broadcast', authorize('notification:write'), broadcast);

module.exports = router;
