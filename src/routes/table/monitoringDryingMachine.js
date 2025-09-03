const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/monitoringDryingMachine');

router.get('/', userController.getAllDryingMachine);
router.get('/:id', userController.getDryingMachineById);
router.post('/', userController.createDryingMachine);
router.put('/', userController.updateDryingMachine);
router.delete('/', userController.deleteDryingMachine);

module.exports = router;