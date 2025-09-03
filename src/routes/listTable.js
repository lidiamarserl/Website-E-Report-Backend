const express = require('express');
const router = express.Router();
const userController = require('../controller/listTable');

router.get('/', userController.getAllListTables);
router.get('/:id', userController.getListTableById);
router.post('/', userController.createListTable);
router.put('/', userController.updateListTable);
router.delete('/', userController.deleteListTable);

module.exports = router;