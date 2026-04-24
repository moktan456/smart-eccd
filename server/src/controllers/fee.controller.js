// SMART ECCD – Fee Management Controller

const { z } = require('zod');
const prisma = require('../config/db');
const { paginate, paginatedResponse } = require('../utils/helpers');
const notificationService = require('../services/notification.service');

const feeStructureSchema = z.object({
  name:        z.string().min(2),
  description: z.string().optional(),
  amount:      z.number().positive(),
  frequency:   z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'ONE_TIME']).default('MONTHLY'),
  dueDay:      z.number().int().min(1).max(31).optional(),
});

const feeRecordSchema = z.object({
  childId:        z.string(),
  feeStructureId: z.string(),
  amount:         z.number().positive(),
  dueDate:        z.string().transform(v => new Date(v)),
});

const paymentSchema = z.object({
  paidAmount:  z.number().positive(),
  receiptNote: z.string().optional(),
});

// ── Fee Structures ─────────────────────────────────────────────

/** GET /api/fees/structures */
const listStructures = async (req, res, next) => {
  try {
    const centerId = req.user.centerId;
    const structures = await prisma.feeStructure.findMany({
      where: { centerId, isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: structures });
  } catch (err) { next(err); }
};

/** POST /api/fees/structures */
const createStructure = async (req, res, next) => {
  try {
    const data = feeStructureSchema.parse(req.body);
    const centerId = req.user.centerId;
    const structure = await prisma.feeStructure.create({ data: { ...data, centerId } });
    res.status(201).json({ success: true, data: structure });
  } catch (err) { next(err); }
};

/** PUT /api/fees/structures/:id */
const updateStructure = async (req, res, next) => {
  try {
    const data = feeStructureSchema.partial().parse(req.body);
    const structure = await prisma.feeStructure.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: structure });
  } catch (err) { next(err); }
};

/** DELETE /api/fees/structures/:id */
const deleteStructure = async (req, res, next) => {
  try {
    await prisma.feeStructure.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Fee structure archived.' });
  } catch (err) { next(err); }
};

// ── Fee Records ────────────────────────────────────────────────

/** GET /api/fees/records – Manager sees center records; Parent sees own children */
const listRecords = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, status, childId } = req.query;
    const where = {};

    if (req.user.role === 'CENTER_MANAGER') {
      where.centerId = req.user.centerId;
    } else if (req.user.role === 'PARENT') {
      const links = await prisma.childParent.findMany({ where: { parentId: req.user.id }, select: { childId: true } });
      where.childId = { in: links.map(l => l.childId) };
    }

    if (status)  where.status  = status;
    if (childId) where.childId = childId;

    const [records, total] = await Promise.all([
      prisma.feeRecord.findMany({
        where,
        include: {
          child:        { select: { id: true, firstName: true, lastName: true, studentId: true } },
          feeStructure: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: 'asc' },
        ...paginate(page, limit),
      }),
      prisma.feeRecord.count({ where }),
    ]);

    res.json({ success: true, ...paginatedResponse(records, total, page, limit) });
  } catch (err) { next(err); }
};

/** POST /api/fees/records – Create fee record for a child */
const createRecord = async (req, res, next) => {
  try {
    const data = feeRecordSchema.parse(req.body);
    const centerId = req.user.centerId;
    const record = await prisma.feeRecord.create({
      data: { ...data, centerId, createdBy: req.user.id },
      include: { child: { select: { id: true, firstName: true, lastName: true } }, feeStructure: true },
    });
    res.status(201).json({ success: true, data: record });
  } catch (err) { next(err); }
};

/** POST /api/fees/records/bulk – Bulk create for all children in a class/center */
const bulkCreateRecords = async (req, res, next) => {
  try {
    const { feeStructureId, dueDate, classId } = req.body;
    const centerId = req.user.centerId;

    const structure = await prisma.feeStructure.findUnique({ where: { id: feeStructureId } });
    if (!structure) return res.status(404).json({ success: false, message: 'Fee structure not found.' });

    const where = { isActive: true, centerId };
    if (classId) where.classId = classId;
    const children = await prisma.child.findMany({ where, select: { id: true } });

    const records = await prisma.$transaction(
      children.map(child =>
        prisma.feeRecord.upsert({
          where: { id: `${feeStructureId}-${child.id}-${dueDate}` },
          create: {
            id: `${feeStructureId}-${child.id}-${dueDate}`,
            childId: child.id,
            feeStructureId,
            centerId,
            amount: structure.amount,
            dueDate: new Date(dueDate),
            createdBy: req.user.id,
          },
          update: {},
        })
      )
    );

    res.status(201).json({ success: true, data: { created: records.length } });
  } catch (err) { next(err); }
};

/** PATCH /api/fees/records/:id/pay – Record payment */
const recordPayment = async (req, res, next) => {
  try {
    const { paidAmount, receiptNote } = paymentSchema.parse(req.body);

    const existing = await prisma.feeRecord.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Fee record not found.' });

    const newPaid = Number(existing.paidAmount || 0) + paidAmount;
    const status  = newPaid >= Number(existing.amount) ? 'PAID' : 'PARTIAL';

    const record = await prisma.feeRecord.update({
      where: { id: req.params.id },
      data:  { paidAmount: newPaid, paidDate: new Date(), status, receiptNote },
      include: { child: { select: { id: true, firstName: true, lastName: true } } },
    });

    res.json({ success: true, data: record });
  } catch (err) { next(err); }
};

/** GET /api/fees/summary – Center fee overview */
const getFeeSummary = async (req, res, next) => {
  try {
    const centerId = req.user.centerId;
    const [pending, overdue, paid, partial] = await Promise.all([
      prisma.feeRecord.count({ where: { centerId, status: 'PENDING' } }),
      prisma.feeRecord.count({ where: { centerId, status: 'OVERDUE' } }),
      prisma.feeRecord.count({ where: { centerId, status: 'PAID' } }),
      prisma.feeRecord.count({ where: { centerId, status: 'PARTIAL' } }),
    ]);

    const totalCollected = await prisma.feeRecord.aggregate({
      where: { centerId, status: { in: ['PAID', 'PARTIAL'] } },
      _sum: { paidAmount: true },
    });

    const totalExpected = await prisma.feeRecord.aggregate({
      where: { centerId },
      _sum: { amount: true },
    });

    res.json({
      success: true,
      data: { pending, overdue, paid, partial, totalCollected: totalCollected._sum.paidAmount || 0, totalExpected: totalExpected._sum.amount || 0 },
    });
  } catch (err) { next(err); }
};

/** POST /api/fees/remind – Send reminders to parents with overdue/pending fees */
const sendReminders = async (req, res, next) => {
  try {
    const centerId = req.user.centerId;
    const today = new Date();

    // Mark overdue
    await prisma.feeRecord.updateMany({
      where: { centerId, status: 'PENDING', dueDate: { lt: today } },
      data:  { status: 'OVERDUE' },
    });

    // Find all pending/overdue records with parents
    const overdueRecords = await prisma.feeRecord.findMany({
      where:   { centerId, status: { in: ['PENDING', 'OVERDUE'] } },
      include: { child: { include: { parents: { include: { parent: { select: { id: true } } } } } }, feeStructure: true },
    });

    // Notify each parent
    const notifications = [];
    const seen = new Set();
    for (const r of overdueRecords) {
      for (const cp of r.child.parents) {
        const key = `${cp.parentId}-${r.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          notifications.push({
            userId:  cp.parent.id,
            type:    'FEE_REMINDER',
            title:   `Fee Due: ${r.feeStructure.name}`,
            message: `${r.child.firstName}'s ${r.feeStructure.name} of ₱${r.amount} is ${r.status === 'OVERDUE' ? 'overdue' : 'due'}.`,
            data:    { feeRecordId: r.id, childId: r.childId },
          });
        }
      }
    }

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    res.json({ success: true, data: { remindersSet: notifications.length } });
  } catch (err) { next(err); }
};

module.exports = { listStructures, createStructure, updateStructure, deleteStructure, listRecords, createRecord, bulkCreateRecords, recordPayment, getFeeSummary, sendReminders };
