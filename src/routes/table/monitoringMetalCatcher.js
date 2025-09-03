const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/monitoringMetalCatcher');

router.get('/', userController.getAllMetalCatcher);
router.get('/:id', userController.getMetalCatcherById);
router.post('/', userController.createMetalCatcher);
router.put('/', userController.updateMetalCatcher);
router.delete('/', userController.deleteMetalCatcher);

module.exports = router;