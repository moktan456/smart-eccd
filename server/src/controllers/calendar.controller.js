// SMART ECCD – Academic Calendar Controller

const { z } = require('zod');
const prisma = require('../config/db');

const eventSchema = z.object({
  title:       z.string().min(2),
  description: z.string().optional(),
  eventType:   z.enum(['HOLIDAY', 'EXAM', 'FUNCTION', 'MEETING', 'ACTIVITY', 'OTHER']).default('OTHER'),
  startDate:   z.string().transform(v => new Date(v)),
  endDate:     z.string().transform(v => new Date(v)),
  isPublic:    z.boolean().default(true),
});

/** GET /api/calendar – All authenticated center users */
const listEvents = async (req, res, next) => {
  try {
    const centerId = req.user.centerId || req.query.centerId;
    const { month, year } = req.query;

    const where = { centerId };
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end   = new Date(year, month, 1);
      where.OR = [
        { startDate: { gte: start, lt: end } },
        { endDate:   { gte: start, lt: end } },
        { startDate: { lt: start }, endDate: { gte: end } },
      ];
    }
    // Parents only see public events
    if (req.user.role === 'PARENT') where.isPublic = true;

    const events = await prisma.academicEvent.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });
    res.json({ success: true, data: events });
  } catch (err) { next(err); }
};

/** POST /api/calendar */
const createEvent = async (req, res, next) => {
  try {
    const data = eventSchema.parse(req.body);
    const centerId = req.user.centerId || req.body.centerId;
    const event = await prisma.academicEvent.create({
      data: { ...data, centerId, createdBy: req.user.id },
    });
    res.status(201).json({ success: true, data: event });
  } catch (err) { next(err); }
};

/** PUT /api/calendar/:id */
const updateEvent = async (req, res, next) => {
  try {
    const data = eventSchema.partial().parse(req.body);
    const event = await prisma.academicEvent.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
};

/** DELETE /api/calendar/:id */
const deleteEvent = async (req, res, next) => {
  try {
    await prisma.academicEvent.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Event deleted.' });
  } catch (err) { next(err); }
};

module.exports = { listEvents, createEvent, updateEvent, deleteEvent };
