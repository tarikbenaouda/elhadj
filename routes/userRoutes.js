const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.post('/verifyOTP', authController.verifyOTP);
router.post(
  '/resetPassword',
  authController.protect,
  authController.resetPassword,
);

router
  .route('/')
  .get(
    authController.protect,
    authController.restrictTo('super-admin', 'admin'),
    userController.getAllUsers,
  )
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(authController.protect, userController.deleteUser);

module.exports = router;
