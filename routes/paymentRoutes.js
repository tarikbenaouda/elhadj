const express = require('express');
const authController = require('../controllers/authController');
const paymentController = require('../controllers/paymentController');

const router = express.Router();
router.use(authController.protect);
router.use(authController.restrictTo('postman'));

router
  .get('/', paymentController.getAllPayments)
  .post('/', paymentController.pay);

module.exports = router;
