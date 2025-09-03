const express = require('express');
const router = express.Router();
const userController = require('../controller/listForm');

router.get('/', userController.getAllListForms);
router.get('/:id', userController.getListFormById);
router.post('/', userController.createListForm);
router.put('/', userController.updateListForm);
router.delete('/', userController.deleteListForm);

module.exports = router;