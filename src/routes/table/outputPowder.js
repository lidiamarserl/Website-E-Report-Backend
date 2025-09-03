const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/outputPowder');

router.get('/', userController.getAllOutputPowder);
router.get('/:id', userController.getOutputPowderById);
router.post('/', userController.createOutputPowder);
router.put('/', userController.updateOutputPowder);
router.delete('/', userController.deleteOutputPowder);

module.exports = router;