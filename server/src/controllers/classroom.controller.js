// SMART ECCD – Classroom Controller (physical rooms)

const { z } = require('zod');
const prisma = require('../config/db');

const classroomSchema = z.object({
  name:     z.string().min(1),
  capacity: z.number().int().positive().optional(),
  floor:    z.string().optional(),
});

/** GET /api/classrooms */
const listClassrooms = async (req, res, next) => {
  try {
    const centerId = req.user.centerId || req.query.centerId;
    const classrooms = await prisma.classroom.findMany({
      where: { centerId, isActive: true },
      include: { classes: { where: { isActive: true }, select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: classrooms });
  } catch (err) { next(err); }
};

/** POST /api/classrooms */
const createClassroom = async (req, res, next) => {
  try {
    const data = classroomSchema.parse(req.body);
    const centerId = req.user.centerId || req.body.centerId;
    const room = await prisma.classroom.create({ data: { ...data, centerId } });
    res.status(201).json({ success: true, data: room });
  } catch (err) { next(err); }
};

/** PUT /api/classrooms/:id */
const updateClassroom = async (req, res, next) => {
  try {
    const data = classroomSchema.partial().parse(req.body);
    const room = await prisma.classroom.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: room });
  } catch (err) { next(err); }
};

/** DELETE /api/classrooms/:id */
const deleteClassroom = async (req, res, next) => {
  try {
    await prisma.classroom.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Classroom archived.' });
  } catch (err) { next(err); }
};

module.exports = { listClassrooms, createClassroom, updateClassroom, deleteClassroom };
