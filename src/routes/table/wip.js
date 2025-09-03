const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/wip');

router.get('/', userController.getAllWip);
router.get('/:id', userController.getWipById);
router.post('/', userController.createWip);
router.put('/', userController.updateWip);
router.delete('/', userController.deleteWip);

module.exports = router;