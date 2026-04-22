// SMART ECCD – Message Controller

const { z } = require('zod');
const prisma = require('../config/db');
const { paginate, paginatedResponse } = require('../utils/helpers');
const { emitToUser } = require('../socket/socket.handler');

const sendMessageSchema = z.object({
  receiverId: z.string(),
  subject: z.string().optional(),
  body: z.string().min(1),
});

const announcementSchema = z.object({
  title: z.string().min(3),
  body: z.string().min(10),
  centerId: z.string().optional(),
});

/**
 * GET /api/messages – Inbox
 */
const getMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const where = { receiverId: req.user.id };

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: { sender: { select: { id: true, name: true, avatar: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      prisma.message.count({ where }),
    ]);

    res.json({ success: true, ...paginatedResponse(messages, total, page, limit) });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/messages – Send a message
 */
const sendMessage = async (req, res, next) => {
  try {
    const data = sendMessageSchema.parse(req.body);
    const message = await prisma.message.create({
      data: { senderId: req.user.id, ...data },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true } },
      },
    });

    // Real-time notification
    emitToUser(data.receiverId, 'new_message', { message });

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/messages/:id/read
 */
const markRead = async (req, res, next) => {
  try {
    const message = await prisma.message.update({
      where: { id: req.params.id },
      data: { status: 'READ' },
    });
    res.json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/announcements – CM | SA
 */
const createAnnouncement = async (req, res, next) => {
  try {
    const data = announcementSchema.parse(req.body);
    const centerId = req.user.role === 'CENTER_MANAGER' ? req.user.centerId : data.centerId;

    const announcement = await prisma.announcement.create({
      data: { ...data, centerId, createdBy: req.user.id },
    });

    res.status(201).json({ success: true, data: announcement });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/announcements
 */
const getAnnouncements = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const centerId = req.user.centerId;
    const where = centerId ? { centerId } : {};

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({ where, orderBy: { createdAt: 'desc' }, ...paginate(page, limit) }),
      prisma.announcement.count({ where }),
    ]);

    res.json({ success: true, ...paginatedResponse(announcements, total, page, limit) });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMessages, sendMessage, markRead, createAnnouncement, getAnnouncements };
