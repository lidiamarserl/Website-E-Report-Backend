const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/monitoringProcessProduction');

router.get('/', userController.getAllProductionProcesses);
router.get('/:id', userController.getProductionProcessById);
router.post('/', userController.createProductionProcess);
router.put('/', userController.updateProductionProcess);
router.delete('/', userController.deleteProductionProcess);

module.exports = router;