const express = require('express');
const registrationController = require('../controllers/registrationController');
const authController = require('../controllers/authController');

const router = express.Router();
router
  .route('/')
  .get(
    authController.protect,
    authController.restrictTo('super-admin', 'admin', 'manager'),
    registrationController.getAllRegistrations,
  )
  .post(
    authController.protect,
    authController.restrictTo('user'),
    registrationController.register,
  );

module.exports = router;
