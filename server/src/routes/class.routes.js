const express = require('express');
const router = express.Router();
const { listClasses, getClassById, createClass, updateClass, deleteClass } = require('../controllers/class.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(authenticate);
router.get('/', authorize('class:read'), listClasses);
router.get('/:id', authorize('class:read'), getClassById);
router.post('/', authorize('class:write'), createClass);
router.put('/:id', authorize('class:write'), updateClass);
router.delete('/:id', authorize('class:write'), deleteClass);

module.exports = router;
