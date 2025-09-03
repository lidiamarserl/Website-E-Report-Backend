const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/monitoringGlass');

router.get('/', userController.getAllGlass);
router.get('/:id', userController.getGlassById);
router.post('/', userController.createGlass);
router.put('/', userController.updateGlass);
router.delete('/', userController.deleteGlass);

module.exports = router;