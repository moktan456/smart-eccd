const express = require('express');
const router = express.Router();
const { markAttendance, getChildAttendance, getAttendanceSummary, getClassAttendance } = require('../controllers/attendance.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(authenticate);
router.post('/', authorize('attendance:write'), markAttendance);
router.get('/child/:id', getChildAttendance);
router.get('/child/:id/summary', getAttendanceSummary);
router.get('/class/:id', authorize('attendance:write'), getClassAttendance);

module.exports = router;
