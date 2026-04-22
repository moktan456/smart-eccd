const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, markRead, createAnnouncement, getAnnouncements } = require('../controllers/message.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(authenticate);
router.get('/', authorize('message:read'), getMessages);
router.post('/', authorize('message:write'), sendMessage);
router.patch('/:id/read', authorize('message:read'), markRead);
router.get('/announcements', getAnnouncements);
router.post('/announcements', authorize('announcement:write'), createAnnouncement);

module.exports = router;
