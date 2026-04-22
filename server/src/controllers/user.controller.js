// SMART ECCD – User Controller

const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../config/db');
const { paginate, paginatedResponse, createError } = require('../utils/helpers');

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER', 'PARENT']),
  centerId: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  avatar: z.string().url().optional().nullable(),
  password: z.string().min(8).optional(),
});

/**
 * GET /api/users  – SA | CM
 */
const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search, centerId } = req.query;

    const where = {};
    // Center managers can only see users in their center
    if (req.user.role === 'CENTER_MANAGER') {
      where.centerId = req.user.centerId;
    } else if (centerId) {
      where.centerId = centerId;
    }
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, role: true, centerId: true, avatar: true, isActive: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, ...paginatedResponse(users, total, page, limit) });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, role: true, centerId: true, avatar: true, isActive: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users – SA | CM
 */
const createUser = async (req, res, next) => {
  try {
    const data = createUserSchema.parse(req.body);

    // CM can only create users in their own center
    if (req.user.role === 'CENTER_MANAGER') {
      data.centerId = req.user.centerId;
      if (['SUPER_ADMIN', 'CENTER_MANAGER'].includes(data.role)) {
        return res.status(403).json({ success: false, message: 'Center Managers cannot create Admin roles.' });
      }
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(409).json({ success: false, message: 'Email already in use.' });

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, passwordHash, role: data.role, centerId: data.centerId },
      select: { id: true, name: true, email: true, role: true, centerId: true, isActive: true, createdAt: true },
    });

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const data = updateUserSchema.parse(req.body);
    const updates = { name: data.name, avatar: data.avatar };
    if (data.password) updates.passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updates,
      select: { id: true, name: true, email: true, role: true, centerId: true, avatar: true, isActive: true },
    });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id/activate – SA | CM
 */
const toggleActivation = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, isActive: true },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/:id – SA
 */
const deleteUser = async (req, res, next) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'User deactivated.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { listUsers, getUserById, createUser, updateUser, toggleActivation, deleteUser };
