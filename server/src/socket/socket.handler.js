// SMART ECCD – Socket.io Handler
// Real-time events: notifications, messages, attendance updates

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;
// Map of userId → Set of socket IDs
const userSockets = new Map();

/**
 * Initialize Socket.io on the HTTP server
 * @param {http.Server} server
 */
const initSocket = (server) => {
  if (process.env.ENABLE_REAL_TIME !== 'true') {
    console.log('ℹ️  Real-time (Socket.io) is disabled. Set ENABLE_REAL_TIME=true to enable.');
    return;
  }

  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // JWT authentication for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required.'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.sub;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token.'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`🔌 Socket connected: user=${userId}`);

    // Track this socket for the user
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    // Join a room named by userId for targeted emission
    socket.join(`user:${userId}`);

    // Join center room for broadcasts
    if (socket.handshake.auth?.centerId) {
      socket.join(`center:${socket.handshake.auth.centerId}`);
    }

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: user=${userId}`);
      userSockets.get(userId)?.delete(socket.id);
      if (userSockets.get(userId)?.size === 0) userSockets.delete(userId);
    });

    // Ping/pong for connection health
    socket.on('ping', () => socket.emit('pong'));
  });

  console.log('✅ Socket.io initialized');
};

/**
 * Emit an event to a specific user (all their connected sockets)
 * @param {string} userId
 * @param {string} event
 * @param {*} data
 */
const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Emit an event to all users in a center
 * @param {string} centerId
 * @param {string} event
 * @param {*} data
 */
const emitToCenter = (centerId, event, data) => {
  if (!io) return;
  io.to(`center:${centerId}`).emit(event, data);
};

/**
 * Broadcast to all connected clients
 */
const broadcast = (event, data) => {
  if (!io) return;
  io.emit(event, data);
};

module.exports = { initSocket, emitToUser, emitToCenter, broadcast };
