const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/monitoringArea');

router.get('/', userController.getAllArea);
router.get('/:id', userController.getAreaById);
router.post('/', userController.createArea);
router.put('/', userController.updateArea);
router.delete('/', userController.deleteArea);

module.exports = router;