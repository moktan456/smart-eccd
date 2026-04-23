// SMART ECCD – Express App Configuration

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Security Headers ────────────────────────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_PREVIEW,
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;                                      // Postman / curl / server-to-server
  if (allowedOrigins.includes(origin)) return true;             // Exact match (CLIENT_URL)
  if (/\.vercel\.app$/.test(origin)) return true;               // Any Vercel preview deployment
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return true;  // Any localhost port
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      // Return false (not an Error) so CORS headers ARE sent with the rejection
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Rate Limiting ───────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// ── Cookie Parsing ──────────────────────────────────────────
app.use(cookieParser());

// ── Body Parsing ────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ─────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Static Files (local uploads) ────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health Check ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ── API Routes ───────────────────────────────────────────────
app.use('/api', routes);

// ── Serve React Frontend (production / local server mode) ────
const clientDist = path.join(__dirname, '../../client/dist');
if (require('fs').existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA fallback — let React Router handle all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  // ── 404 (dev mode — frontend runs separately on Vite) ─────
  app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
  });
}

// ── Global Error Handler ────────────────────────────────────
app.use(errorHandler);

module.exports = app;
