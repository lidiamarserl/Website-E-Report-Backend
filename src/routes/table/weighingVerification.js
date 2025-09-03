const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/weighingVerification');

router.get('/', userController.getAllWeighingVerification);
router.get('/:id', userController.getWeighingVerificationById);
router.post('/', userController.createWeighingVerification);
router.put('/', userController.updateWeighingVerification);
router.delete('/', userController.deleteWeighingVerification);

module.exports = router;