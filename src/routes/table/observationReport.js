const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/observationReport');

router.get('/', userController.getAllObservationReport);
router.get('/:id', userController.getObservationReportById);
router.post('/', userController.createObservationReport);
router.put('/', userController.updateObservationReport);
router.delete('/', userController.deleteObservationReport);

module.exports = router;