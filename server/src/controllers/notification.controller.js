// SMART ECCD – Notification Controller

const prisma = require('../config/db');
const { paginate, paginatedResponse } = require('../utils/helpers');

/**
 * GET /api/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const where = { userId: req.user.id };
    if (unreadOnly === 'true') where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
    ]);

    res.json({ success: true, ...paginatedResponse(notifications, total, page, limit), unreadCount });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/notifications/:id/read
 */
const markRead = async (req, res, next) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/notifications/read-all
 */
const markAllRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/notifications/broadcast – CENTER_MANAGER
 * Send a notice to all parents / teachers / everyone in the center
 */
const broadcast = async (req, res, next) => {
  try {
    const { title, message, type = 'GENERAL', targetRole } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, message: 'title and message are required.' });

    const centerId = req.user.centerId;

    // Build role filter
    const roleFilter = targetRole === 'ALL'
      ? { in: ['PARENT', 'TEACHER'] }
      : targetRole;

    const users = await prisma.user.findMany({
      where: { centerId, role: typeof roleFilter === 'string' ? roleFilter : roleFilter },
      select: { id: true },
    });

    if (users.length === 0) return res.json({ success: true, sent: 0 });

    await prisma.notification.createMany({
      data: users.map(u => ({
        userId:  u.id,
        title,
        message,
        type,
      })),
    });

    res.json({ success: true, sent: users.length });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/notifications/sent – CENTER_MANAGER
 * Returns recent broadcast notifications from this center
 */
const getSent = async (req, res, next) => {
  try {
    const centerId = req.user.centerId;
    // Get distinct notifications sent to users of this center (latest per title)
    const sent = await prisma.notification.findMany({
      where: {
        user: { centerId },
        type: { in: ['GENERAL', 'EVENT', 'FEE_REMINDER', 'ATTENDANCE'] },
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['title', 'message'],
      take: 50,
      select: { id: true, title: true, message: true, type: true, createdAt: true },
    });
    res.json({ success: true, data: sent });
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, markRead, markAllRead, broadcast, getSent };
