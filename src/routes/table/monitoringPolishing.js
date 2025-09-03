const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/monitoringPolishing');

router.get('/', userController.getAllPolishing);
router.get('/:id', userController.getPolishingById);
router.post('/', userController.createPolishing);
router.put('/', userController.updatePolishing);
router.delete('/', userController.deletePolishing);

module.exports = router;