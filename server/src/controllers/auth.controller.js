// SMART ECCD – Auth Controller

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../config/db');
const { sendEmail } = require('../config/email');
const { generateOtp, createError } = require('../utils/helpers');

// ── Schemas ─────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotSchema = z.object({ email: z.string().email() });

const resetSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(8),
});

// ── Token Helpers ────────────────────────────────────────────
const generateTokens = (user) => {
  const payload = { sub: user.id, role: user.role, centerId: user.centerId };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  return { accessToken, refreshToken };
};

// ── Controllers ──────────────────────────────────────────────

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,                                       // required for sameSite: 'none'
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',  // 'none' for cross-origin (Vercel→Render)
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          centerId: user.centerId,
          avatar: user.avatar,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } });
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/refresh
 */
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: 'No refresh token.' });

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive.' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { token } });
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,                                       // required for sameSite: 'none'
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',  // 'none' for cross-origin (Vercel→Render)
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, centerId: true, avatar: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = forgotSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to avoid email enumeration
    if (!user) return res.json({ success: true, message: 'If this email exists, an OTP has been sent.' });

    const otp = generateOtp();
    await prisma.otpCode.create({
      data: { email, code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });

    await sendEmail({
      to: email,
      subject: 'SMART ECCD – Password Reset OTP',
      text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
      html: `<p>Your SMART ECCD password reset OTP is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
    });

    res.json({ success: true, message: 'If this email exists, an OTP has been sent.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = resetSchema.parse(req.body);

    const record = await prisma.otpCode.findFirst({
      where: { email, code: otp, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { email }, data: { passwordHash } });
    await prisma.otpCode.update({ where: { id: record.id }, data: { used: true } });

    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/register-parent
 * Parent self-registration using their child's studentId
 */
const registerParent = async (req, res, next) => {
  try {
    const schema = z.object({
      studentId: z.string().min(1),
      name:      z.string().min(2),
      email:     z.string().email(),
      password:  z.string().min(8),
      phone:     z.string().optional(),
    });

    const { studentId, name, email, password, phone } = schema.parse(req.body);

    // Verify child exists
    const child = await prisma.child.findUnique({ where: { studentId }, include: { center: true } });
    if (!child) {
      return res.status(404).json({ success: false, message: 'Student ID not found. Please check and try again.' });
    }

    // Check email not already used
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already in use.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const parent = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, passwordHash, role: 'PARENT', centerId: child.centerId, phone },
        select: { id: true, name: true, email: true, role: true, centerId: true },
      });

      // Link parent to child (if not already linked)
      const alreadyLinked = await tx.childParent.findUnique({
        where: { childId_parentId: { childId: child.id, parentId: user.id } },
      });
      if (!alreadyLinked) {
        await tx.childParent.create({ data: { childId: child.id, parentId: user.id, isPrimary: true } });
      }

      return user;
    });

    const { accessToken, refreshToken } = generateTokens(parent);

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: parent.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        user: { id: parent.id, name: parent.name, email: parent.email, role: parent.role, centerId: parent.centerId },
        child: { id: child.id, firstName: child.firstName, lastName: child.lastName, studentId: child.studentId },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/verify-student/:studentId
 * Public endpoint – look up a child by studentId (no auth required)
 */
const verifyStudentId = async (req, res, next) => {
  try {
    const child = await prisma.child.findUnique({
      where: { studentId: req.params.studentId },
      select: { id: true, firstName: true, lastName: true, studentId: true, center: { select: { name: true } } },
    });
    if (!child) return res.status(404).json({ success: false, message: 'Student ID not found.' });
    res.json({ success: true, data: child });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, logout, refresh, getMe, forgotPassword, resetPassword, registerParent, verifyStudentId };
