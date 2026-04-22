// SMART ECCD – Dashboard Controller

const prisma = require('../config/db');
const bloomService = require('../services/bloom.service');

/**
 * GET /api/dashboard/center-stats – CM | SA
 * Center homepage statistics
 */
const getCenterStats = async (req, res, next) => {
  try {
    const centerId = req.user.centerId || req.query.centerId;

    const [totalChildren, totalClasses, totalTeachers, totalActivities, recentFlags, bloomCoverage] =
      await Promise.all([
        prisma.child.count({ where: { centerId, isActive: true } }),
        prisma.class.count({ where: { centerId, isActive: true } }),
        prisma.user.count({ where: { centerId, role: 'TEACHER', isActive: true } }),
        prisma.activity.count({ where: { centerId, status: 'PUBLISHED' } }),
        prisma.childPerformance.count({ where: { isFlagged: true, child: { centerId } } }),
        bloomService.getCenterBloomCoverage(centerId),
      ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await prisma.attendance.count({
      where: { date: { gte: today }, status: 'PRESENT', child: { centerId } },
    });

    res.json({
      success: true,
      data: {
        totalChildren,
        totalClasses,
        totalTeachers,
        totalActivities,
        recentFlags,
        todayAttendance,
        bloomCoverage,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/teacher-today – Teacher
 * Teacher's activities for today + class stats
 */
const getTeacherToday = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayAssignments, classInfo, pendingCount] = await Promise.all([
      prisma.activityAssignment.findMany({
        where: {
          teacherId: req.user.id,
          scheduledDate: { gte: today, lt: tomorrow },
          status: { not: 'COMPLETED' },
        },
        include: {
          activity: { select: { id: true, title: true, bloomLevels: true, durationMins: true } },
          class: { select: { id: true, name: true, _count: { select: { children: true } } } },
        },
      }),
      prisma.class.findFirst({
        where: { teacherId: req.user.id, isActive: true },
        include: { _count: { select: { children: true } } },
      }),
      prisma.activityAssignment.count({
        where: { teacherId: req.user.id, status: 'PENDING' },
      }),
    ]);

    res.json({
      success: true,
      data: { todayAssignments, classInfo, pendingCount },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/parent/:childId – Parent
 * Parent child summary
 */
const getParentDashboard = async (req, res, next) => {
  try {
    const childId = req.params.childId;

    // Verify parent owns this child
    const link = await prisma.childParent.findUnique({
      where: { childId_parentId: { childId, parentId: req.user.id } },
    });
    if (!link) return res.status(403).json({ success: false, message: 'Access denied.' });

    const [child, bloomProfile, recentPerformances, attendanceSummary] = await Promise.all([
      prisma.child.findUnique({
        where: { id: childId },
        include: { class: { include: { teacher: { select: { id: true, name: true } } } } },
      }),
      bloomService.getChildBloomProfile(childId),
      prisma.childPerformance.findMany({
        where: { childId },
        include: { record: { include: { assignment: { include: { activity: { select: { title: true } } } } } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.attendance.groupBy({
        by: ['status'],
        where: { childId, date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        _count: true,
      }),
    ]);

    res.json({
      success: true,
      data: { child, bloomProfile, recentPerformances, attendanceSummary },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/super-admin – SA
 */
const getSuperAdminStats = async (req, res, next) => {
  try {
    const [totalCenters, totalUsers, totalChildren, totalActivities] = await Promise.all([
      prisma.center.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.child.count({ where: { isActive: true } }),
      prisma.activity.count({ where: { status: 'PUBLISHED' } }),
    ]);

    const centers = await prisma.center.findMany({
      where: { isActive: true },
      include: { _count: { select: { children: true, classes: true } } },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { totalCenters, totalUsers, totalChildren, totalActivities, centers },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCenterStats, getTeacherToday, getParentDashboard, getSuperAdminStats };
