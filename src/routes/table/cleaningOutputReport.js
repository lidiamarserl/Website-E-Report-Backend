const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/cleaningOutputReport');

router.get('/', userController.getAllCleaningOutputReport);
router.get('/:id', userController.getCleaningOutputReportById);
router.post('/', userController.createCleaningOutputReport);
router.put('/', userController.updateCleaningOutputReport);
router.delete('/', userController.deleteCleaningOutputReport);

module.exports = router;