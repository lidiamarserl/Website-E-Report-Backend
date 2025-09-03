const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/workinProcess');

router.get('/', userController.getAllWorkinProcess);
router.get('/:id', userController.getWorkinProcessById);
router.post('/', userController.createWorkinProcess);
router.put('/', userController.updateWorkinProcess);
router.delete('/', userController.deleteWorkinProcess);

module.exports = router;