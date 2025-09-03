const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/outputDeo');

router.get('/', userController.getAllOutputDeo);
router.get('/:id', userController.getOutputDeoById);
router.post('/', userController.createOutputDeo);
router.put('/', userController.updateOutputDeo);
router.delete('/', userController.deleteOutputDeo);

module.exports = router;