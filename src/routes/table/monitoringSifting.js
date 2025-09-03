const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/monitoringShifting');

router.get('/', userController.getAllSifting);
router.get('/:id', userController.getSiftingById);
router.post('/', userController.createSifting);
router.put('/', userController.updateSifting);
router.delete('/', userController.deleteSifting);

module.exports = router;