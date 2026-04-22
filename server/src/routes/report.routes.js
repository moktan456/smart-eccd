const express = require('express');
const router = express.Router();
const { getChildReport, getCenterReport } = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

router.use(authenticate);
router.get('/child/:id', requireRole('SUPER_ADMIN', 'CENTER_MANAGER'), getChildReport);
router.get('/center', requireRole('SUPER_ADMIN', 'CENTER_MANAGER'), getCenterReport);

module.exports = router;
