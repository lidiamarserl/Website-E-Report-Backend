const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/processFilterButterLokal');

router.get('/', userController.getAllFilterButterLokal);
router.get('/:id', userController.getFilterButterLokalById);
router.post('/', userController.createFilterButterLokal);
router.put('/', userController.updateFilterButterLokal);
router.delete('/', userController.deleteFilterButterLokal);

module.exports = router;