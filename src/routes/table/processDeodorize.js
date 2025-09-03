const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/processDeodorize');

router.get('/', userController.getAllProcessDeodorize);
router.get('/:id', userController.getProcessDeodorizeById);
router.post('/', userController.createProcessDeodorize);
router.put('/', userController.updateProcessDeodorize);
router.delete('/', userController.deleteProcessDeodorize);

module.exports = router;