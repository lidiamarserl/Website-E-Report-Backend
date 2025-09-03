const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/earlyShiftCheck');

router.get('/', userController.getAllEarlyShiftChecks);
router.get('/:id', userController.getEarlyShiftCheckById);
router.post('/', userController.createEarlyShiftCheck);
router.put('/', userController.updateEarlyShiftCheck);
router.delete('/', userController.deleteEarlyShiftCheck);

module.exports = router;