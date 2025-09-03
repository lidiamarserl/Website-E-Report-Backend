const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/startupChecklistOperasional');

router.get('/', userController.getAllStartupChecklistOperasional);
router.get('/:id', userController.getStartupChecklistOperasionalById);
router.post('/', userController.createStartupChecklistOperasional);
router.put('/', userController.updateStartupChecklistOperasional);
router.delete('/', userController.deleteStartupChecklistOperasional);

module.exports = router;