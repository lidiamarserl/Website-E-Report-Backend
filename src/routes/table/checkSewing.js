const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/checkSewing');

router.get('/', userController.getAllCheckSewings);
router.get('/:id', userController.getCheckSewingById);
router.post('/', userController.createCheckSewing);
router.put('/', userController.updateCheckSewing);
router.delete('/', userController.deleteCheckSewing);

module.exports = router;