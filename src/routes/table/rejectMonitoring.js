const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/rejectMonitoring');

router.get('/', userController.getAllRejectMonitoring);
router.get('/:id', userController.getRejectMonitoringById);
router.post('/', userController.createRejectMonitoring);
router.put('/', userController.updateRejectMonitoring);
router.delete('/', userController.deleteRejectMonitoring);

module.exports = router;