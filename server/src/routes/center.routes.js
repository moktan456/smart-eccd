const express = require('express');
const router = express.Router();
const { listCenters, getCenterById, createCenter, updateCenter, deleteCenter } = require('../controllers/center.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

router.use(authenticate);
router.get('/', requireRole('SUPER_ADMIN', 'CENTER_MANAGER'), listCenters);
router.get('/:id', requireRole('SUPER_ADMIN', 'CENTER_MANAGER'), getCenterById);
router.post('/', requireRole('SUPER_ADMIN'), createCenter);
router.put('/:id', requireRole('SUPER_ADMIN'), updateCenter);
router.delete('/:id', requireRole('SUPER_ADMIN'), deleteCenter);

module.exports = router;
