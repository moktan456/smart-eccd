const express = require('express');
const router = express.Router();
const { listClassrooms, createClassroom, updateClassroom, deleteClassroom } = require('../controllers/classroom.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(authenticate);
router.get('/',    authorize('class:read'),   listClassrooms);
router.post('/',   authorize('class:write'),  createClassroom);
router.put('/:id', authorize('class:write'),  updateClassroom);
router.delete('/:id', authorize('class:write'), deleteClassroom);

module.exports = router;
