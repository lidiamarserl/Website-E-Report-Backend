const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/monitoringPressureFilterDuyvis');

router.get('/', userController.getAllPressureFilter);
router.get('/:id', userController.getPressureFilterById);
router.post('/', userController.createPressureFilter);
router.put('/', userController.updatePressureFilter);
router.delete('/', userController.deletePressureFilter);

module.exports = router;