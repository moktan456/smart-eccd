// SMART ECCD – Center Controller

const { z } = require('zod');
const prisma = require('../config/db');
const { paginate, paginatedResponse } = require('../utils/helpers');

const centerSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  managerId: z.string(),
});

const updateCenterSchema = centerSchema.partial();

/**
 * GET /api/centers – SA
 */
const listCenters = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const where = search ? { name: { contains: search, mode: 'insensitive' } } : {};

    const [centers, total] = await Promise.all([
      prisma.center.findMany({
        where,
        include: { manager: { select: { id: true, name: true, email: true } }, _count: { select: { classes: true, children: true } } },
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      prisma.center.count({ where }),
    ]);

    res.json({ success: true, ...paginatedResponse(centers, total, page, limit) });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/centers/:id
 */
const getCenterById = async (req, res, next) => {
  try {
    const center = await prisma.center.findUnique({
      where: { id: req.params.id },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        _count: { select: { classes: true, children: true, users: true } },
      },
    });
    if (!center) return res.status(404).json({ success: false, message: 'Center not found.' });
    res.json({ success: true, data: center });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/centers – SA
 */
const createCenter = async (req, res, next) => {
  try {
    const data = centerSchema.parse(req.body);
    const center = await prisma.center.create({
      data,
      include: { manager: { select: { id: true, name: true, email: true } } },
    });
    // Link manager to center
    await prisma.user.update({ where: { id: data.managerId }, data: { centerId: center.id } });
    res.status(201).json({ success: true, data: center });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/centers/:id – SA
 */
const updateCenter = async (req, res, next) => {
  try {
    const data = updateCenterSchema.parse(req.body);
    const center = await prisma.center.update({
      where: { id: req.params.id },
      data,
      include: { manager: { select: { id: true, name: true, email: true } } },
    });
    res.json({ success: true, data: center });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/centers/:id – SA
 */
const deleteCenter = async (req, res, next) => {
  try {
    await prisma.center.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Center deactivated.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { listCenters, getCenterById, createCenter, updateCenter, deleteCenter };
