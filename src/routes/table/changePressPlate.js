const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/changePressPlate');

router.get('/', userController.getAllChangePressPlate);
router.get('/:id', userController.getChangePressPlateById);
router.post('/', userController.createChangePressPlate);
router.put('/', userController.updateChangePressPlate);
router.delete('/', userController.deleteChangePressPlate);

module.exports = router;