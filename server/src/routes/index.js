// SMART ECCD – Centralised Route Registry

const express = require('express');
const router = express.Router();

router.use('/auth',          require('./auth.routes'));
router.use('/users',         require('./user.routes'));
router.use('/centers',       require('./center.routes'));
router.use('/classes',       require('./class.routes'));
router.use('/children',      require('./child.routes'));
router.use('/activities',    require('./activity.routes'));
router.use('/performance',   require('./performance.routes'));
router.use('/attendance',    require('./attendance.routes'));
router.use('/messages',      require('./message.routes'));
router.use('/dashboard',     require('./dashboard.routes'));
router.use('/reports',       require('./report.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/classrooms',   require('./classroom.routes'));
router.use('/calendar',     require('./calendar.routes'));
router.use('/fees',         require('./fee.routes'));
router.use('/leave',        require('./leave.routes'));

module.exports = router;
