// SMART ECCD – Global Error Handler Middleware

const { Prisma } = require('@prisma/client');

const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);

  // Prisma unique constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: `Duplicate entry: ${err.meta?.target?.join(', ')} already exists.`,
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File is too large. Maximum 10MB allowed.' });
  }

  // Custom app errors
  if (err.status) {
    return res.status(err.status).json({ success: false, message: err.message });
  }

  // Default 500
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
  });
};

module.exports = errorHandler;
