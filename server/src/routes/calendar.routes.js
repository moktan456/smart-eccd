const express = require('express');
const router = express.Router();
const { listEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/calendar.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(authenticate);
router.get('/',    listEvents);
router.post('/',   authorize('class:write'), createEvent);
router.put('/:id', authorize('class:write'), updateEvent);
router.delete('/:id', authorize('class:write'), deleteEvent);

module.exports = router;
