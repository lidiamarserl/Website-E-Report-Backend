const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/winnowingOutputReport');

router.get('/', userController.getAllWinnowingOutputReport);
router.get('/:id', userController.getWinnowingOutputReportById);
router.post('/', userController.createWinnowingOutputReport);
router.put('/', userController.updateWinnowingOutputReport);
router.delete('/', userController.deleteWinnowingOutputReport);

module.exports = router;