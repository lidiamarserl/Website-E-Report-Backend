const express = require('express');
const router = express.Router();
const userController = require('../controller/listFormTable');

router.get('/', userController.getAllListFormTables);
router.get('/:id', userController.getListFormTableById);
router.post('/', userController.createListFormTable);
router.put('/', userController.updateListFormTable);
router.delete('/', userController.deleteListFormTable);

module.exports = router;