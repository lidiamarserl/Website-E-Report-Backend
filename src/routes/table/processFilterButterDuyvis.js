const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/processFilterButterDuyvis');

router.get('/', userController.getAllFilterButterDuyvis);
router.get('/:id', userController.getFilterButterDuyvisById);
router.post('/', userController.createFilterButterDuyvis);
router.put('/', userController.updateFilterButterDuyvis);
router.delete('/', userController.deleteFilterButterDuyvis);

module.exports = router;