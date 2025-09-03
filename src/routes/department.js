const express = require('express');
const router = express.Router();
const userController = require('../controller/department');

router.get('/', userController.getAllDepartments);
router.get('/:id', userController.getDepartmentById);
router.post('/', userController.createDepartment);
router.put('/', userController.updateDepartment);
router.delete('/', userController.deleteDepartment);

module.exports = router;