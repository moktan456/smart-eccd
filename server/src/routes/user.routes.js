const express = require('express');
const router = express.Router();
const { listUsers, getUserById, createUser, updateUser, toggleActivation, deleteUser } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(authenticate);
router.get('/', authorize('user:read'), listUsers);
router.get('/:id', authorize('user:read'), getUserById);
router.post('/', authorize('user:write'), createUser);
router.put('/:id', authorize('user:write'), updateUser);
router.patch('/:id/activate', authorize('user:write'), toggleActivation);
router.delete('/:id', authorize('user:write'), deleteUser);

module.exports = router;
