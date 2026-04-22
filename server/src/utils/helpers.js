// SMART ECCD – Server Utility Helpers

const crypto = require('crypto');

/**
 * Paginate a Prisma query
 * @param {number} page
 * @param {number} limit
 * @returns {{ skip: number, take: number }}
 */
const paginate = (page = 1, limit = 20) => ({
  skip: (Number(page) - 1) * Number(limit),
  take: Number(limit),
});

/**
 * Build a paginated response object
 */
const paginatedResponse = (data, total, page, limit) => ({
  data,
  pagination: {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
  },
});

/**
 * Generate a 6-digit OTP
 */
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Encrypt a string using AES-256-CBC
 */
const encrypt = (text) => {
  const key = Buffer.from(process.env.ENCRYPTION_KEY || '0'.repeat(64), 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt an AES-256-CBC encrypted string
 */
const decrypt = (encryptedText) => {
  const [ivHex, encrypted] = encryptedText.split(':');
  const key = Buffer.from(process.env.ENCRYPTION_KEY || '0'.repeat(64), 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

/**
 * Create an AppError with a status code
 */
const createError = (message, status = 400) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

module.exports = { paginate, paginatedResponse, generateOtp, encrypt, decrypt, createError };
