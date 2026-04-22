// SMART ECCD – Main Server Entry Point
// Initialises Express app + Socket.io

require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { initSocket } = require('./src/socket/socket.handler');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Attach Socket.io
initSocket(server);

server.listen(PORT, () => {
  console.log(`\n🚀 SMART ECCD Server running on port ${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Client URL  : ${process.env.CLIENT_URL}`);
  console.log(`   Real-time   : ${process.env.ENABLE_REAL_TIME === 'true' ? 'enabled' : 'disabled'}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
