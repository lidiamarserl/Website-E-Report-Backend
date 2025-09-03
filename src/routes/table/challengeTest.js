const express = require('express');
const router = express.Router();
const userController = require('../../controller/table/challengeTest');

router.get('/', userController.getAllChallengeTests)
router.get('/:id', userController.getChallengeTestById);
router.post('/', userController.createChallengeTest);
router.put('/', userController.updateChallengeTest);
router.delete('/', userController.deleteChallengeTest);

module.exports = router;