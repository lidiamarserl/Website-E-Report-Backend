const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/downtime');

router.get('/', userController.getAllDowntimes);
router.get('/:id', userController.getDowntimeById);
router.post('/', userController.createDowntime);
router.put('/', userController.updateDowntime);
router.delete('/', userController.deleteDowntime);

module.exports = router;