const express = require('express');
const router = express.Router();
const { listChildren, getChildById, createChild, updateChild, deleteChild } = require('../controllers/child.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(authenticate);
router.get('/', authorize('child:read'), listChildren);
router.get('/:id', authorize('child:read'), getChildById);
router.post('/', authorize('child:write'), createChild);
router.put('/:id', authorize('child:write'), updateChild);
router.delete('/:id', authorize('child:write'), deleteChild);

module.exports = router;
