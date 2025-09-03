const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/processTime');

router.get('/', userController.getAllProcessTime);
router.get('/:id', userController.getProcessTimeById);
router.post('/', userController.createProcessTime);
router.put('/', userController.updateProcessTime);
router.delete('/', userController.deleteProcessTime);

module.exports = router;