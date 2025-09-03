const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/cocoaRecord');

router.get('/', userController.getAllCocoaRecord);
router.get('/:id', userController.getCocoaRecordById);
router.post('/', userController.createCocoaRecord);
router.put('/', userController.updateCocoaRecord);
router.delete('/', userController.deleteCocoaRecord);

module.exports = router;