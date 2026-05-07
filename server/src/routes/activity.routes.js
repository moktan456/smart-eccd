const express = require('express');
const router = express.Router();
const {
  listActivities, getActivityById, createActivity, updateActivity, archiveActivity,
  assignActivity, getMyAssignments, conductActivity, uploadActivityEvidence,
} = require('../controllers/activity.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { uploadImage } = require('../config/storage');

// Multer error handler for the 1 MB image evidence route
const handleImageUpload = (req, res, next) => {
  uploadImage.single('image')(req, res, (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Image exceeds the 1 MB size limit. Please compress or resize the photo before uploading.',
      });
    }
    if (err) return next(err);
    next();
  });
};

router.use(authenticate);
router.get('/', authorize('activity:read'), listActivities);
router.get('/assignments/my', authorize('activity:conduct'), getMyAssignments);
router.post('/upload-evidence', authorize('activity:conduct'), handleImageUpload, uploadActivityEvidence);
router.get('/:id', authorize('activity:read'), getActivityById);
router.post('/', authorize('activity:write'), createActivity);
router.put('/:id', authorize('activity:write'), updateActivity);
router.delete('/:id', authorize('activity:write'), archiveActivity);
router.post('/:id/assign', authorize('activity:write'), assignActivity);
router.post('/assignments/:id/conduct', authorize('activity:conduct'), conductActivity);

module.exports = router;
