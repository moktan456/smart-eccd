// SMART ECCD – Child Controller

const { z } = require('zod');
const prisma = require('../config/db');
const { paginate, paginatedResponse, encrypt, decrypt } = require('../utils/helpers');

const childSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().transform((v) => new Date(v)),
  classId: z.string(),
  centerId: z.string().optional(),
  photo: z.string().url().optional().nullable(),
  medicalNotes: z.string().optional().nullable(),
  parentIds: z.array(z.string()).optional(),
});

/**
 * GET /api/children – CM | SA | Teacher
 */
const listChildren = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, classId, search } = req.query;
    const where = { isActive: true };

    if (req.user.role === 'CENTER_MANAGER') {
      where.centerId = req.user.centerId;
    } else if (req.user.role === 'TEACHER') {
      // Teacher sees only their class children
      const teacherClasses = await prisma.class.findMany({
        where: { teacherId: req.user.id },
        select: { id: true },
      });
      where.classId = { in: teacherClasses.map((c) => c.id) };
    } else if (req.user.role === 'PARENT') {
      // Parent sees only their own children
      const links = await prisma.childParent.findMany({
        where: { parentId: req.user.id },
        select: { childId: true },
      });
      where.id = { in: links.map((l) => l.childId) };
    }

    if (classId) where.classId = classId;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [children, total] = await Promise.all([
      prisma.child.findMany({
        where,
        include: {
          class: { select: { id: true, name: true } },
          parents: { include: { parent: { select: { id: true, name: true, email: true } } } },
        },
        orderBy: { firstName: 'asc' },
        ...paginate(page, limit),
      }),
      prisma.child.count({ where }),
    ]);

    res.json({ success: true, ...paginatedResponse(children, total, page, limit) });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/children/:id
 */
const getChildById = async (req, res, next) => {
  try {
    const child = await prisma.child.findUnique({
      where: { id: req.params.id },
      include: {
        class: { select: { id: true, name: true, teacher: { select: { id: true, name: true } } } },
        parents: { include: { parent: { select: { id: true, name: true, email: true } } } },
      },
    });
    if (!child) return res.status(404).json({ success: false, message: 'Child not found.' });

    // Decrypt medical notes for authorized roles
    const result = { ...child };
    if (result.medicalNotesEnc) {
      result.medicalNotes = decrypt(result.medicalNotesEnc);
      delete result.medicalNotesEnc;
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/children – CM | SA
 */
const createChild = async (req, res, next) => {
  try {
    const { parentIds, medicalNotes, ...data } = childSchema.parse(req.body);
    if (req.user.role === 'CENTER_MANAGER') data.centerId = req.user.centerId;

    const childData = { ...data };
    if (medicalNotes) childData.medicalNotesEnc = encrypt(medicalNotes);

    const child = await prisma.child.create({
      data: {
        ...childData,
        parents: parentIds?.length
          ? { create: parentIds.map((pid) => ({ parentId: pid })) }
          : undefined,
      },
      include: {
        class: { select: { id: true, name: true } },
        parents: { include: { parent: { select: { id: true, name: true } } } },
      },
    });

    res.status(201).json({ success: true, data: child });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/children/:id – CM | SA
 */
const updateChild = async (req, res, next) => {
  try {
    const { medicalNotes, ...data } = childSchema.partial().parse(req.body);
    const updates = { ...data };
    if (medicalNotes !== undefined) {
      updates.medicalNotesEnc = medicalNotes ? encrypt(medicalNotes) : null;
    }

    const child = await prisma.child.update({
      where: { id: req.params.id },
      data: updates,
    });
    res.json({ success: true, data: child });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/children/:id – CM | SA
 */
const deleteChild = async (req, res, next) => {
  try {
    await prisma.child.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Child record archived.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { listChildren, getChildById, createChild, updateChild, deleteChild };
