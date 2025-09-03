const express = require('express');
const router = express.Router();
const userController = require('../controller/report');

router.get('/', userController.getAllReports);
router.get('/:id', userController.getReportById);
router.post('/', userController.createReport);
router.put('/', userController.updateReport);
router.delete('/', userController.deleteReport);

module.exports = router;