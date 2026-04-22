// SMART ECCD – Storage Configuration
// Supports local disk or Cloudinary based on UPLOAD_PROVIDER env var

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_PROVIDER = process.env.UPLOAD_PROVIDER || 'local';
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_DOC_TYPES = ['application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ── Local Storage ────────────────────────────────────────────
const localUploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(localUploadDir)) fs.mkdirSync(localUploadDir, { recursive: true });

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = file.mimetype.startsWith('video/') ? 'videos' : 'images';
    const dir = path.join(localUploadDir, subDir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

// ── Cloudinary Storage ───────────────────────────────────────
let cloudinaryStorage = null;
if (UPLOAD_PROVIDER === 'cloudinary') {
  const cloudinary = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  cloudinaryStorage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => ({
      folder: 'smart-eccd',
      resource_type: file.mimetype.startsWith('video/') ? 'video' : 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm', 'mov', 'pdf'],
    }),
  });
}

const fileFilter = (req, file, cb) => {
  const allowed = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_DOC_TYPES];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage: UPLOAD_PROVIDER === 'cloudinary' ? cloudinaryStorage : localStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

/**
 * Get the public URL for a locally uploaded file
 */
const getLocalFileUrl = (req, filePath) => {
  const relativePath = filePath.replace(localUploadDir, '').replace(/\\/g, '/');
  return `${req.protocol}://${req.get('host')}/uploads${relativePath}`;
};

module.exports = { upload, getLocalFileUrl, UPLOAD_PROVIDER };
