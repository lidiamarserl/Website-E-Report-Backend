const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/holdQc');

router.get('/', userController.getAllHoldQCs);
router.get('/:id', userController.getHoldQCById);
router.post('/', userController.createHoldQC);
router.put('/', userController.updateHoldQC);
router.delete('/', userController.deleteHoldQC);

module.exports = router;