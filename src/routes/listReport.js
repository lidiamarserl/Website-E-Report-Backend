const express = require('express');
const router = express.Router();
const userController = require('../controller/listReport');

router.get('/', userController.getAllListReports);
router.get('/:id', userController.getListReportById);
router.post('/', userController.createListReport);
router.put('/', userController.updateListReport);
router.delete('/', userController.deleteListReport);

module.exports = router;