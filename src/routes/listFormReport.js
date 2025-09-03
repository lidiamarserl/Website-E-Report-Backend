const express = require('express');
const router = express.Router();
const userController = require('../controller/listFormReport');

router.get('/', userController.getAllListFormReports);
router.get('/:id', userController.getListFormReportById);
router.post('/', userController.createListFormReport);
router.put('/', userController.updateListFormReport);
router.delete('/', userController.deleteListFormReport);

module.exports = router;