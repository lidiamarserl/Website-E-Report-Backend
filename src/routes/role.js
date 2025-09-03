const express = require('express');
const router = express.Router();
const userController = require('../controller/role');

router.get('/', userController.getAllRoles);
router.get('/:id', userController.getRoleById);
router.post('/', userController.createRole);
router.put('/', userController.updateRole);
router.delete('/', userController.deleteRole);

module.exports = router;