const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/temperingAasted');

router.get('/', userController.getAllTemperingAasted);
router.get('/:id', userController.getTemperingAastedById);
router.post('/', userController.createTemperingAasted);
router.put('/', userController.updateTemperingAasted);
router.delete('/', userController.deleteTemperingAasted);

module.exports = router;