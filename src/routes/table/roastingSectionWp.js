const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/roastingSectionWp');

router.get('/', userController.getAllRoastingSectionWp);
router.get('/:id', userController.getRoastingSectionWpById);
router.post('/', userController.createRoastingSectionWp);
router.put('/', userController.updateRoastingSectionWp);
router.delete('/', userController.deleteRoastingSectionWp);

module.exports = router;