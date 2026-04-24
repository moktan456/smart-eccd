// SMART ECCD – Leave Request Controller

const { z } = require('zod');
const prisma = require('../config/db');
const { paginate, paginatedResponse } = require('../utils/helpers');

const leaveSchema = z.object({
  childId:   z.string(),
  startDate: z.string().transform(v => new Date(v)),
  endDate:   z.string().transform(v => new Date(v)),
  reason:    z.string().min(5),
});

const reviewSchema = z.object({
  status:     z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().optional(),
});

/** GET /api/leave – Parent sees own children's; Manager/Teacher sees center */
const listLeaves = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const where = {};

    if (req.user.role === 'PARENT') {
      const links = await prisma.childParent.findMany({ where: { parentId: req.user.id }, select: { childId: true } });
      where.childId = { in: links.map(l => l.childId) };
    } else if (req.user.role === 'TEACHER') {
      const classes = await prisma.class.findMany({ where: { teacherId: req.user.id }, select: { id: true } });
      const children = await prisma.child.findMany({ where: { classId: { in: classes.map(c => c.id) } }, select: { id: true } });
      where.childId = { in: children.map(c => c.id) };
    } else if (req.user.role === 'CENTER_MANAGER') {
      const children = await prisma.child.findMany({ where: { centerId: req.user.centerId }, select: { id: true } });
      where.childId = { in: children.map(c => c.id) };
    }

    if (status) where.status = status;

    const [leaves, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        include: {
          child:    { select: { id: true, firstName: true, lastName: true, studentId: true, class: { select: { name: true } } } },
          parent:   { select: { id: true, name: true } },
          reviewer: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    res.json({ success: true, ...paginatedResponse(leaves, total, page, limit) });
  } catch (err) { next(err); }
};

/** POST /api/leave – Parent creates leave request */
const createLeave = async (req, res, next) => {
  try {
    const data = leaveSchema.parse(req.body);

    // Verify parent owns this child
    const link = await prisma.childParent.findUnique({
      where: { childId_parentId: { childId: data.childId, parentId: req.user.id } },
    });
    if (!link) return res.status(403).json({ success: false, message: 'You are not linked to this child.' });

    const leave = await prisma.leaveRequest.create({
      data: { ...data, requestedBy: req.user.id },
      include: { child: { select: { id: true, firstName: true, lastName: true } } },
    });

    // Notify teacher
    const child = await prisma.child.findUnique({ where: { id: data.childId }, include: { class: { select: { teacherId: true } } } });
    if (child?.class?.teacherId) {
      await prisma.notification.create({
        data: {
          userId:  child.class.teacherId,
          type:    'ANNOUNCEMENT',
          title:   `Leave Request: ${child.firstName} ${child.lastName}`,
          message: `Leave requested from ${data.startDate.toDateString()} to ${data.endDate.toDateString()}. Reason: ${data.reason}`,
          data:    { leaveId: leave.id },
        },
      });
    }

    res.status(201).json({ success: true, data: leave });
  } catch (err) { next(err); }
};

/** PATCH /api/leave/:id/review – Manager/Teacher approves or rejects */
const reviewLeave = async (req, res, next) => {
  try {
    const { status, reviewNote } = reviewSchema.parse(req.body);

    const leave = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data:  { status, reviewNote, reviewedBy: req.user.id },
      include: {
        child:  { select: { firstName: true, lastName: true } },
        parent: { select: { id: true } },
      },
    });

    // Notify parent
    await prisma.notification.create({
      data: {
        userId:  leave.parent.id,
        type:    status === 'APPROVED' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
        title:   `Leave ${status}: ${leave.child.firstName} ${leave.child.lastName}`,
        message: reviewNote || `Leave request has been ${status.toLowerCase()}.`,
        data:    { leaveId: leave.id },
      },
    });

    // If approved, mark attendance as EXCUSED for those days
    if (status === 'APPROVED') {
      const dates = [];
      const d = new Date(leave.startDate);
      while (d <= new Date(leave.endDate)) {
        dates.push(new Date(d));
        d.setDate(d.getDate() + 1);
      }
      await prisma.$transaction(
        dates.map(date =>
          prisma.attendance.upsert({
            where:  { childId_date: { childId: leave.childId, date } },
            create: { childId: leave.childId, date, status: 'EXCUSED', note: `Approved leave: ${reviewNote || ''}` },
            update: { status: 'EXCUSED', note: `Approved leave: ${reviewNote || ''}` },
          })
        )
      );
    }

    res.json({ success: true, data: leave });
  } catch (err) { next(err); }
};

module.exports = { listLeaves, createLeave, reviewLeave };
