const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/monitoringTemperatureD');

router.get('/', userController.getAllTemperatureD);
router.get('/:id', userController.getTemperatureDById);
router.post('/', userController.createTemperatureD);
router.put('/', userController.updateTemperatureD);
router.delete('/', userController.deleteTemperatureD);

module.exports = router;