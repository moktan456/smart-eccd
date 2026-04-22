const express = require('express');
const router = express.Router();
const { login, logout, refresh, getMe, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', authenticate, getMe);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

module.exports = router;
