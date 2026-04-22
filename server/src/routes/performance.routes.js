const express = require('express');
const router = express.Router();
const {
  getChildPerformance, getChildBloomProfile, getChildTrend,
  getClassPerformance, getCenterBloomCoverage, getChildFlags,
} = require('../controllers/performance.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/child/:id', getChildPerformance);
router.get('/child/:id/bloom', getChildBloomProfile);
router.get('/child/:id/trend', getChildTrend);
router.get('/child/:id/flags', getChildFlags);
router.get('/class/:id', getClassPerformance);
router.get('/center/bloom-coverage', getCenterBloomCoverage);

module.exports = router;
