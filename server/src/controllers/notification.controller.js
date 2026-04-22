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

module.exports = { getNotifications, markRead, markAllRead };
