const express = require('express');
const router = express.Router();
const userController = require('../controller/test');

router.get('/', userController.getAllTests);
router.get('/:id', userController.getTestById);
router.post('/', userController.createTest);
router.put('/', userController.updateTest);
router.delete('/', userController.deleteTest);

module.exports = router;