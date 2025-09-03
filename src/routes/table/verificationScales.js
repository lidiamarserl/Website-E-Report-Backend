const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/verificationScales');

router.get('/', userController.getAllVerificationScales);
router.get('/:id', userController.getVerificationScalesById);
router.post('/', userController.createVerificationScales);
router.put('/', userController.updateVerificationScales);
router.delete('/', userController.deleteVerificationScales);

module.exports = router;