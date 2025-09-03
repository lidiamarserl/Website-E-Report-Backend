const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/startupChecklistEquipment');

router.get('/', userController.getAllStartupChecklistEquipment);
router.get('/:id', userController.getStartupChecklistEquipmentById);
router.post('/', userController.createStartupChecklistEquipment);
router.put('/', userController.updateStartupChecklistEquipment);
router.delete('/', userController.deleteStartupChecklistEquipment);

module.exports = router;