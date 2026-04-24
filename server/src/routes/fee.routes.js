const express = require('express');
const router = express.Router();
const { listStructures, createStructure, updateStructure, deleteStructure,
        listRecords, createRecord, bulkCreateRecords, recordPayment, getFeeSummary, sendReminders } = require('../controllers/fee.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(authenticate);

// Fee structures
router.get('/structures',        authorize('fee:read'),  listStructures);
router.post('/structures',       authorize('fee:write'), createStructure);
router.put('/structures/:id',    authorize('fee:write'), updateStructure);
router.delete('/structures/:id', authorize('fee:write'), deleteStructure);

// Fee records
router.get('/records',           listRecords);          // manager + parent
router.post('/records',          authorize('fee:write'), createRecord);
router.post('/records/bulk',     authorize('fee:write'), bulkCreateRecords);
router.patch('/records/:id/pay', authorize('fee:write'), recordPayment);

// Summary + reminders
router.get('/summary',   authorize('fee:read'),  getFeeSummary);
router.post('/remind',   authorize('fee:write'), sendReminders);

module.exports = router;
