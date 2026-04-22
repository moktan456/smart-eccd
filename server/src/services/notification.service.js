// SMART ECCD – Notification Service
// Creates DB notifications and emits real-time events

const prisma = require('../config/db');
const { emitToUser } = require('../socket/socket.handler');

/**
 * Create a notification and push it via Socket.io
 *
 * @param {Object} params
 * @param {string} params.userId - Recipient user ID
 * @param {string} params.type - NotificationType enum value
 * @param {string} params.title
 * @param {string} params.message
 * @param {Object} params.data - Optional payload
 */
const createNotification = async ({ userId, type, title, message, data }) => {
  const notification = await prisma.notification.create({
    data: { userId, type, title, message, data },
  });

  // Emit via Socket.io if enabled
  if (process.env.ENABLE_REAL_TIME === 'true') {
    emitToUser(userId, 'notification', notification);
  }

  return notification;
};

/**
 * Notify all parents of a child when performance is recorded
 */
const notifyParentsOfPerformance = async (childId, activityTitle) => {
  const links = await prisma.childParent.findMany({
    where: { childId },
    include: { child: { select: { firstName: true } } },
  });

  await Promise.all(
    links.map((link) =>
      createNotification({
        userId: link.parentId,
        type: 'PERFORMANCE_RECORDED',
        title: 'New Performance Record',
        message: `${link.child.firstName}'s performance for "${activityTitle}" has been recorded.`,
        data: { childId },
      })
    )
  );
};

/**
 * Notify teacher when an activity is assigned to them
 */
const notifyTeacherAssignment = async (teacherId, activityTitle, scheduledDate) => {
  await createNotification({
    userId: teacherId,
    type: 'ACTIVITY_ASSIGNED',
    title: 'New Activity Assigned',
    message: `"${activityTitle}" has been assigned to your class on ${new Date(scheduledDate).toLocaleDateString()}.`,
    data: { scheduledDate },
  });
};

/**
 * Notify parents when a child is flagged
 */
const notifyFlagRaised = async (childId, flagReason) => {
  const links = await prisma.childParent.findMany({
    where: { childId },
    include: { child: { select: { firstName: true } } },
  });

  await Promise.all(
    links.map((link) =>
      createNotification({
        userId: link.parentId,
        type: 'FLAG_RAISED',
        title: 'Developmental Concern Flagged',
        message: `A developmental concern has been noted for ${link.child.firstName}: ${flagReason}`,
        data: { childId },
      })
    )
  );
};

module.exports = { createNotification, notifyParentsOfPerformance, notifyTeacherAssignment, notifyFlagRaised };
