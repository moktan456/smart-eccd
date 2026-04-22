const express = require('express');
const router = express.Router();
const { getCenterStats, getTeacherToday, getParentDashboard, getSuperAdminStats } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

router.use(authenticate);
router.get('/center-stats', requireRole('SUPER_ADMIN', 'CENTER_MANAGER'), getCenterStats);
router.get('/teacher-today', requireRole('TEACHER'), getTeacherToday);
router.get('/parent/:childId', requireRole('PARENT'), getParentDashboard);
router.get('/super-admin', requireRole('SUPER_ADMIN'), getSuperAdminStats);

module.exports = router;
