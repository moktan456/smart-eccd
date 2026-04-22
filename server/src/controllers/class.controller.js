// SMART ECCD – Class Controller

const { z } = require('zod');
const prisma = require('../config/db');
const { paginate, paginatedResponse } = require('../utils/helpers');

const classSchema = z.object({
  name: z.string().min(2),
  ageGroup: z.string().min(1),
  teacherId: z.string(),
  centerId: z.string().optional(),
});

/**
 * GET /api/classes – CM | SA
 */
const listClasses = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const centerId = req.user.role === 'CENTER_MANAGER' ? req.user.centerId : req.query.centerId;
    const where = { isActive: true, ...(centerId && { centerId }) };

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        include: {
          teacher: { select: { id: true, name: true, email: true } },
          _count: { select: { children: true } },
        },
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      prisma.class.count({ where }),
    ]);

    res.json({ success: true, ...paginatedResponse(classes, total, page, limit) });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/classes/:id
 */
const getClassById = async (req, res, next) => {
  try {
    const klass = await prisma.class.findUnique({
      where: { id: req.params.id },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        children: { where: { isActive: true }, select: { id: true, firstName: true, lastName: true, photo: true, dateOfBirth: true } },
        _count: { select: { children: true, assignments: true } },
      },
    });
    if (!klass) return res.status(404).json({ success: false, message: 'Class not found.' });
    res.json({ success: true, data: klass });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/classes – CM | SA
 */
const createClass = async (req, res, next) => {
  try {
    const data = classSchema.parse(req.body);
    if (req.user.role === 'CENTER_MANAGER') data.centerId = req.user.centerId;

    const klass = await prisma.class.create({
      data,
      include: { teacher: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json({ success: true, data: klass });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/classes/:id – CM | SA
 */
const updateClass = async (req, res, next) => {
  try {
    const data = classSchema.partial().parse(req.body);
    const klass = await prisma.class.update({
      where: { id: req.params.id },
      data,
      include: { teacher: { select: { id: true, name: true, email: true } } },
    });
    res.json({ success: true, data: klass });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/classes/:id – CM | SA
 */
const deleteClass = async (req, res, next) => {
  try {
    await prisma.class.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Class archived.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { listClasses, getClassById, createClass, updateClass, deleteClass };
