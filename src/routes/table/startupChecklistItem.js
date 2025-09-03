const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/startupChecklistItem');

router.get('/', userController.getAllStartupChecklistItem);
router.get('/:id', userController.getStartupChecklistItemById);
router.post('/', userController.createStartupChecklistItem);
router.put('/', userController.updateStartupChecklistItem);
router.delete('/', userController.deleteStartupChecklistItem);

module.exports = router;