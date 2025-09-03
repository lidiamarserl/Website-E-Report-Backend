const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/monitoringTemperatureRh');

router.get('/', userController.getAllTemperatureRH);
router.get('/:id', userController.getTemperatureRHById);
router.post('/', userController.createTemperatureRH);
router.put('/', userController.updateTemperatureRH);
router.delete('/', userController.deleteTemperatureRH);

module.exports = router;