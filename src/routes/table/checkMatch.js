const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/checkMatch');

router.get('/', userController.getAllCheckMatch);
router.get('/:id', userController.getCheckMatchById);
router.post('/', userController.createCheckMatch);
router.put('/', userController.updateCheckMatch);
router.delete('/', userController.deleteCheckMatch);

module.exports = router;