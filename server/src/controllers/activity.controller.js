// SMART ECCD – Activity Controller

const { z } = require('zod');
const prisma = require('../config/db');
const { paginate, paginatedResponse } = require('../utils/helpers');

const activitySchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  instructions: z.string().min(10),
  bloomLevels: z.array(z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'])).min(1),
  activityType: z.enum(['Individual', 'Group', 'Outdoor', 'Creative']),
  ageGroup: z.string().min(1),
  durationMins: z.number().int().positive(),
  resources: z.array(z.string()).optional().default([]),
  learningGoals: z.array(z.string()).min(1),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional().default('DRAFT'),
});

const assignSchema = z.object({
  classId: z.string(),
  teacherId: z.string(),
  scheduledDate: z.string().transform((v) => new Date(v)),
  scheduledTime: z.string(),
  isRecurring: z.boolean().optional().default(false),
  recurringRule: z.string().optional(),
});

const conductSchema = z.object({
  conductedDate: z.string().transform((v) => new Date(v)),
  notes: z.string().optional(),
  performances: z.array(
    z.object({
      childId: z.string(),
      completionStatus: z.enum(['COMPLETED', 'PARTIAL', 'NOT_ATTEMPTED']),
      bloomLevelAchieved: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']),
      skillRatings: z.record(z.number().min(1).max(5)),
      observationNotes: z.string().optional(),
      evidenceUrls: z.array(z.string()).optional().default([]),
    })
  ),
  attendances: z.array(
    z.object({
      childId: z.string(),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
      note: z.string().optional(),
    })
  ),
});

/**
 * GET /api/activities – All authenticated
 */
const listActivities = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, bloomLevel, activityType, search } = req.query;
    const where = { status: { not: 'ARCHIVED' } };

    if (req.user.role === 'CENTER_MANAGER') where.centerId = req.user.centerId;
    if (req.user.role === 'TEACHER') where.centerId = req.user.centerId;
    if (status) where.status = status;
    if (activityType) where.activityType = activityType;
    if (bloomLevel) where.bloomLevels = { has: bloomLevel };
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: { createdBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      prisma.activity.count({ where }),
    ]);

    res.json({ success: true, ...paginatedResponse(activities, total, page, limit) });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/activities/:id
 */
const getActivityById = async (req, res, next) => {
  try {
    const activity = await prisma.activity.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { id: true, name: true } },
        assignments: {
          include: { class: { select: { id: true, name: true } } },
          orderBy: { scheduledDate: 'desc' },
          take: 5,
        },
      },
    });
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found.' });
    res.json({ success: true, data: activity });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/activities – CM | SA
 */
const createActivity = async (req, res, next) => {
  try {
    const data = activitySchema.parse(req.body);
    const centerId = req.user.role === 'CENTER_MANAGER' ? req.user.centerId : req.body.centerId;

    const activity = await prisma.activity.create({
      data: { ...data, centerId, createdById: req.user.id },
    });
    res.status(201).json({ success: true, data: activity });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/activities/:id – CM | SA
 */
const updateActivity = async (req, res, next) => {
  try {
    const data = activitySchema.partial().parse(req.body);
    const activity = await prisma.activity.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: activity });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/activities/:id – CM | SA (archive)
 */
const archiveActivity = async (req, res, next) => {
  try {
    await prisma.activity.update({ where: { id: req.params.id }, data: { status: 'ARCHIVED' } });
    res.json({ success: true, message: 'Activity archived.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/activities/:id/assign – CM | SA
 */
const assignActivity = async (req, res, next) => {
  try {
    const data = assignSchema.parse(req.body);
    const assignment = await prisma.activityAssignment.create({
      data: { activityId: req.params.id, ...data },
      include: {
        activity: { select: { id: true, title: true } },
        class: { select: { id: true, name: true } },
      },
    });
    res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/activities/assignments/my – Teacher
 */
const getMyAssignments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const where = { teacherId: req.user.id };
    if (status) where.status = status;

    const [assignments, total] = await Promise.all([
      prisma.activityAssignment.findMany({
        where,
        include: {
          activity: true,
          class: { select: { id: true, name: true, children: { where: { isActive: true }, select: { id: true, firstName: true, lastName: true, photo: true } } } },
        },
        orderBy: { scheduledDate: 'asc' },
        ...paginate(page, limit),
      }),
      prisma.activityAssignment.count({ where }),
    ]);

    res.json({ success: true, ...paginatedResponse(assignments, total, page, limit) });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/activities/assignments/:id/conduct – Teacher
 */
const conductActivity = async (req, res, next) => {
  try {
    const { conductedDate, notes, performances, attendances } = conductSchema.parse(req.body);

    const record = await prisma.$transaction(async (tx) => {
      // Create the activity record
      const activityRecord = await tx.activityRecord.create({
        data: {
          assignmentId: req.params.id,
          conductedDate,
          notes,
          performances: {
            create: performances.map((p) => ({
              childId: p.childId,
              completionStatus: p.completionStatus,
              bloomLevelAchieved: p.bloomLevelAchieved,
              skillRatings: p.skillRatings,
              observationNotes: p.observationNotes,
              evidenceUrls: p.evidenceUrls,
            })),
          },
          attendances: {
            create: attendances.map((a) => ({
              childId: a.childId,
              date: conductedDate,
              status: a.status,
              note: a.note,
            })),
          },
        },
        include: { performances: true, attendances: true },
      });

      // Update assignment status
      await tx.activityAssignment.update({
        where: { id: req.params.id },
        data: { status: 'COMPLETED' },
      });

      // Flag children below average
      await flagUnderperformers(tx, performances, activityRecord.id);

      return activityRecord;
    });

    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

// Helper: Flag children whose bloom level is below class average
const flagUnderperformers = async (tx, performances, recordId) => {
  const bloomOrder = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const avgIndex =
    performances.reduce((sum, p) => sum + bloomOrder.indexOf(p.bloomLevelAchieved), 0) /
    performances.length;

  for (const p of performances) {
    const childIndex = bloomOrder.indexOf(p.bloomLevelAchieved);
    const percentBelow = (avgIndex - childIndex) / (avgIndex || 1);
    if (percentBelow >= 0.2) {
      await tx.childPerformance.updateMany({
        where: { childId: p.childId, recordId },
        data: { isFlagged: true, flagReason: 'Performance 20%+ below class average.' },
      });
    }
  }
};

module.exports = {
  listActivities,
  getActivityById,
  createActivity,
  updateActivity,
  archiveActivity,
  assignActivity,
  getMyAssignments,
  conductActivity,
};
