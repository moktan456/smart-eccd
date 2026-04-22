// SMART ECCD – Performance Controller

const prisma = require('../config/db');
const bloomService = require('../services/bloom.service');
const { paginate, paginatedResponse } = require('../utils/helpers');

/**
 * GET /api/performance/child/:id – Teacher | CM | SA | Parent (own child)
 */
const getChildPerformance = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, bloomLevel, completionStatus } = req.query;
    const where = { childId: req.params.id };
    if (bloomLevel) where.bloomLevelAchieved = bloomLevel;
    if (completionStatus) where.completionStatus = completionStatus;

    const [performances, total] = await Promise.all([
      prisma.childPerformance.findMany({
        where,
        include: { record: { include: { assignment: { include: { activity: { select: { title: true, bloomLevels: true } } } } } } },
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      prisma.childPerformance.count({ where }),
    ]);

    res.json({ success: true, ...paginatedResponse(performances, total, page, limit) });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/performance/child/:id/bloom – Bloom radar data
 */
const getChildBloomProfile = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const profile = await bloomService.getChildBloomProfile(req.params.id, { startDate, endDate });
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/performance/child/:id/trend – Trend over time
 */
const getChildTrend = async (req, res, next) => {
  try {
    const { weeks = 8 } = req.query;
    const trend = await bloomService.getChildBloomTrend(req.params.id, Number(weeks));
    res.json({ success: true, data: trend });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/performance/class/:id – Class summary
 */
const getClassPerformance = async (req, res, next) => {
  try {
    const summary = await bloomService.getClassBloomSummary(req.params.id);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/performance/center/bloom-coverage – CM | SA
 */
const getCenterBloomCoverage = async (req, res, next) => {
  try {
    const centerId = req.user.centerId || req.query.centerId;
    const { month } = req.query;
    const coverage = await bloomService.getCenterBloomCoverage(centerId, month);
    res.json({ success: true, data: coverage });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/performance/child/:id/flags – Flagged performance records
 */
const getChildFlags = async (req, res, next) => {
  try {
    const flags = await prisma.childPerformance.findMany({
      where: { childId: req.params.id, isFlagged: true },
      include: { record: { include: { assignment: { include: { activity: { select: { title: true } } } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: flags });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getChildPerformance,
  getChildBloomProfile,
  getChildTrend,
  getClassPerformance,
  getCenterBloomCoverage,
  getChildFlags,
};
