const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/transfer');

router.get('/', userController.getAllTransfer);
router.get('/:id', userController.getTransferById);
router.post('/', userController.createTransfer);
router.put('/', userController.updateTransfer);
router.delete('/', userController.deleteTransfer);

module.exports = router;