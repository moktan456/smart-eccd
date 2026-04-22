const express = require('express');
const router = express.Router();
const {
  listActivities, getActivityById, createActivity, updateActivity, archiveActivity,
  assignActivity, getMyAssignments, conductActivity,
} = require('../controllers/activity.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(authenticate);
router.get('/', authorize('activity:read'), listActivities);
router.get('/assignments/my', authorize('activity:conduct'), getMyAssignments);
router.get('/:id', authorize('activity:read'), getActivityById);
router.post('/', authorize('activity:write'), createActivity);
router.put('/:id', authorize('activity:write'), updateActivity);
router.delete('/:id', authorize('activity:write'), archiveActivity);
router.post('/:id/assign', authorize('activity:write'), assignActivity);
router.post('/assignments/:id/conduct', authorize('activity:conduct'), conductActivity);

module.exports = router;
