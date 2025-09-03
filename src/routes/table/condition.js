const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/condition');

router.get('/', userController.getAllConditions);
router.get('/:id', userController.getConditionById);
router.post('/', userController.createCondition);
router.put('/', userController.updateCondition);
router.delete('/', userController.deleteCondition);

module.exports = router;