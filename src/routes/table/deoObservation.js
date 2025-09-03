const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/deoObservation');

router.get('/', userController.getAllDeoObservation);
router.get('/:id', userController.getDeoObservationById);
router.post('/', userController.createDeoObservation);
router.put('/', userController.updateDeoObservation);
router.delete('/', userController.deleteDeoObservation);

module.exports = router;