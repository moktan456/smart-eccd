const express = require('express');
const router = express.Router();
const { listLeaves, createLeave, reviewLeave } = require('../controllers/leave.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/',               listLeaves);
router.post('/',              createLeave);
router.patch('/:id/review',   reviewLeave);

module.exports = router;
