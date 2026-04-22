// SMART ECCD – Bloom's Taxonomy Analytics Engine
// Core business logic for performance aggregation and insights

const prisma = require('../config/db');
const { BLOOM_LEVELS, FLAG_THRESHOLD } = require('../utils/constants');

/**
 * Get a child's Bloom's profile (radar chart data)
 * Returns: { REMEMBER: 72, UNDERSTAND: 65, APPLY: 80, ... }
 * Score = avg of (levelWeight × completionMultiplier) normalized to 100
 *
 * @param {string} childId
 * @param {{ startDate?: string, endDate?: string }} dateRange
 */
const getChildBloomProfile = async (childId, dateRange = {}) => {
  const where = { childId };
  if (dateRange.startDate || dateRange.endDate) {
    where.createdAt = {};
    if (dateRange.startDate) where.createdAt.gte = new Date(dateRange.startDate);
    if (dateRange.endDate) where.createdAt.lte = new Date(dateRange.endDate);
  }

  const performances = await prisma.childPerformance.findMany({
    where,
    select: { bloomLevelAchieved: true, completionStatus: true, skillRatings: true },
  });

  const completionMultiplier = { COMPLETED: 1.0, PARTIAL: 0.6, NOT_ATTEMPTED: 0.1 };

  const scores = Object.fromEntries(BLOOM_LEVELS.map((l) => [l, { total: 0, count: 0 }]));

  for (const p of performances) {
    const multiplier = completionMultiplier[p.completionStatus] || 0.5;
    const skillAvg = _avgSkillRatings(p.skillRatings);
    const score = (skillAvg / 5) * multiplier * 100;

    scores[p.bloomLevelAchieved].total += score;
    scores[p.bloomLevelAchieved].count += 1;
  }

  const profile = {};
  for (const level of BLOOM_LEVELS) {
    const { total, count } = scores[level];
    profile[level] = count > 0 ? Math.round(total / count) : 0;
  }

  return profile;
};

/**
 * Get a child's Bloom progression over time (line chart data)
 * Returns weekly data points per Bloom level
 *
 * @param {string} childId
 * @param {number} weeks - Number of past weeks to include
 */
const getChildBloomTrend = async (childId, weeks = 8) => {
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  const performances = await prisma.childPerformance.findMany({
    where: { childId, createdAt: { gte: since } },
    select: { bloomLevelAchieved: true, completionStatus: true, skillRatings: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Group by week
  const weekMap = new Map();
  for (const p of performances) {
    const weekStart = _getWeekStart(p.createdAt);
    const key = weekStart.toISOString();
    if (!weekMap.has(key)) {
      weekMap.set(key, { week: weekStart, data: {} });
      BLOOM_LEVELS.forEach((l) => (weekMap.get(key).data[l] = { total: 0, count: 0 }));
    }
    const completionMultiplier = { COMPLETED: 1.0, PARTIAL: 0.6, NOT_ATTEMPTED: 0.1 };
    const multiplier = completionMultiplier[p.completionStatus] || 0.5;
    const score = (_avgSkillRatings(p.skillRatings) / 5) * multiplier * 100;
    weekMap.get(key).data[p.bloomLevelAchieved].total += score;
    weekMap.get(key).data[p.bloomLevelAchieved].count += 1;
  }

  return Array.from(weekMap.values()).map(({ week, data }) => {
    const point = { week: week.toISOString().slice(0, 10) };
    for (const level of BLOOM_LEVELS) {
      const { total, count } = data[level];
      point[level] = count > 0 ? Math.round(total / count) : null;
    }
    return point;
  });
};

/**
 * Get class-level Bloom's distribution
 * Returns average score per Bloom level across all children in the class
 *
 * @param {string} classId
 */
const getClassBloomSummary = async (classId) => {
  const children = await prisma.child.findMany({
    where: { classId, isActive: true },
    select: { id: true, firstName: true, lastName: true },
  });

  const summaries = await Promise.all(
    children.map(async (child) => ({
      child,
      profile: await getChildBloomProfile(child.id),
    }))
  );

  // Class average per level
  const classAvg = {};
  for (const level of BLOOM_LEVELS) {
    const scores = summaries.map((s) => s.profile[level]).filter((v) => v > 0);
    classAvg[level] = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }

  return { children: summaries, classAverage: classAvg };
};

/**
 * Get center-wide Bloom's coverage
 * Shows which levels are under-represented in activity design
 * Flags levels below 10% coverage
 *
 * @param {string} centerId
 * @param {string} month - optional 'YYYY-MM'
 */
const getCenterBloomCoverage = async (centerId, month) => {
  const where = { centerId, status: 'PUBLISHED' };

  if (month) {
    const [year, m] = month.split('-').map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 1);
    where.createdAt = { gte: start, lt: end };
  }

  const activities = await prisma.activity.findMany({ where, select: { bloomLevels: true } });

  const counts = Object.fromEntries(BLOOM_LEVELS.map((l) => [l, 0]));
  let total = 0;

  for (const activity of activities) {
    for (const level of activity.bloomLevels) {
      counts[level]++;
      total++;
    }
  }

  const coverage = {};
  for (const level of BLOOM_LEVELS) {
    const pct = total > 0 ? Math.round((counts[level] / total) * 100) : 0;
    coverage[level] = {
      count: counts[level],
      percentage: pct,
      isUnderUtilised: pct < 10,
    };
  }

  return coverage;
};

/**
 * Analyse a child's progress and return flagged developmental concerns
 * Compares child to class average per Bloom level
 *
 * @param {string} childId
 */
const analyseChildProgress = async (childId) => {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { classId: true, firstName: true, lastName: true },
  });
  if (!child) return [];

  const [childProfile, classSummary] = await Promise.all([
    getChildBloomProfile(childId),
    getClassBloomSummary(child.classId),
  ]);

  const flags = [];
  for (const level of BLOOM_LEVELS) {
    const childScore = childProfile[level];
    const classAvg = classSummary.classAverage[level];
    if (classAvg > 0 && childScore < classAvg) {
      const gap = (classAvg - childScore) / classAvg;
      if (gap >= FLAG_THRESHOLD) {
        flags.push({
          level,
          childScore,
          classAverage: classAvg,
          gapPercentage: Math.round(gap * 100),
          suggestion: `Consider additional ${level.toLowerCase()} level activities for ${child.firstName}.`,
        });
      }
    }
  }

  return flags;
};

// ── Private Helpers ──────────────────────────────────────────

const _avgSkillRatings = (skillRatings) => {
  if (!skillRatings || typeof skillRatings !== 'object') return 2.5;
  const values = Object.values(skillRatings).filter((v) => typeof v === 'number');
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 2.5;
};

const _getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

module.exports = {
  getChildBloomProfile,
  getChildBloomTrend,
  getClassBloomSummary,
  getCenterBloomCoverage,
  analyseChildProgress,
};
