// SMART ECCD – Attendance Controller

const { z } = require('zod');
const prisma = require('../config/db');
const { paginate, paginatedResponse } = require('../utils/helpers');

const markAttendanceSchema = z.array(
  z.object({
    childId: z.string(),
    date: z.string().transform((v) => new Date(v)),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
    note: z.string().optional(),
  })
);

/**
 * POST /api/attendance – Teacher
 * Bulk mark attendance for a date
 */
const markAttendance = async (req, res, next) => {
  try {
    const records = markAttendanceSchema.parse(req.body);

    const results = await prisma.$transaction(
      records.map((r) =>
        prisma.attendance.upsert({
          where: { childId_date: { childId: r.childId, date: r.date } },
          create: r,
          update: { status: r.status, note: r.note },
        })
      )
    );

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/attendance/child/:id – All roles
 * Get child's attendance history
 */
const getChildAttendance = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, startDate, endDate, status } = req.query;
    const where = { childId: req.params.id };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        orderBy: { date: 'desc' },
        ...paginate(page, limit),
      }),
      prisma.attendance.count({ where }),
    ]);

    res.json({ success: true, ...paginatedResponse(attendance, total, page, limit) });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/attendance/child/:id/summary
 * Returns counts by status for heatmap/calendar
 */
const getAttendanceSummary = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const startDate = new Date(`${year || new Date().getFullYear()}-${month || '01'}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + (month ? 1 : 12));

    const records = await prisma.attendance.findMany({
      where: { childId: req.params.id, date: { gte: startDate, lt: endDate } },
      select: { date: true, status: true },
      orderBy: { date: 'asc' },
    });

    const summary = {
      records,
      counts: {
        PRESENT: records.filter((r) => r.status === 'PRESENT').length,
        ABSENT: records.filter((r) => r.status === 'ABSENT').length,
        LATE: records.filter((r) => r.status === 'LATE').length,
        EXCUSED: records.filter((r) => r.status === 'EXCUSED').length,
      },
    };

    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/attendance/class/:id – Teacher | CM
 * Get all attendance for a class on a specific date
 */
const getClassAttendance = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required.' });

    const klass = await prisma.class.findUnique({
      where: { id: req.params.id },
      include: { children: { where: { isActive: true }, select: { id: true, firstName: true, lastName: true, photo: true } } },
    });

    if (!klass) return res.status(404).json({ success: false, message: 'Class not found.' });

    const targetDate = new Date(date);
    const childIds = klass.children.map((c) => c.id);

    const attendance = await prisma.attendance.findMany({
      where: { childId: { in: childIds }, date: { gte: targetDate, lt: new Date(targetDate.getTime() + 86400000) } },
    });

    const attendanceMap = Object.fromEntries(attendance.map((a) => [a.childId, a]));

    const result = klass.children.map((child) => ({
      child,
      attendance: attendanceMap[child.id] || null,
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { markAttendance, getChildAttendance, getAttendanceSummary, getClassAttendance };
