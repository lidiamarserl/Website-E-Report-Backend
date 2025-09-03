const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/winnowingOutputReport2');

router.get('/', userController.getAllWinnowingOutputReport2);
router.get('/:id', userController.getWinnowingOutputReport2ById);
router.post('/', userController.createWinnowingOutputReport2);
router.put('/', userController.updateWinnowingOutputReport2);
router.delete('/', userController.deleteWinnowingOutputReport2);

module.exports = router;