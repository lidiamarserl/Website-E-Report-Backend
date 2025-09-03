const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/butterTank');

router.get('/', userController.getAllButterTanks);
router.get('/:id', userController.getButterTankById);
router.post('/', userController.createButterTank);
router.put('/', userController.updateButterTank);
router.delete('/', userController.deleteButterTank);

module.exports = router;