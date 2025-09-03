const express = require('express');
const router = express.Router();
const userController = require('../controller/form');

router.get('/', userController.getAllForms);
router.get('/:id', userController.getFormById);
router.post('/', userController.createForm);
router.put('/:id', userController.updateSingleForm);
// router.put('/', userController.updateMultipleForms);
router.put('/:id', userController.updateForm);
router.delete('/', userController.deleteForm);



module.exports = router;