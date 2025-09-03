const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/roastingSection');

router.get('/', userController.getAllRoastingSection);
router.get('/:id', userController.getRoastingSectionById);
router.post('/', userController.createRoastingSection);
router.put('/', userController.updateRoastingSection);
router.delete('/', userController.deleteRoastingSection);

module.exports = router;