const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/checkSealing');

router.get('/', userController.getAllCheckSealings);
router.get('/:id', userController.getCheckSealingById);
router.post('/', userController.createCheckSealing);
router.put('/', userController.updateCheckSealing);
router.delete('/', userController.deleteCheckSealing);

module.exports = router;