const express = require('express');
const authController = require('../controllers/authController');
const flightController = require('../controllers/flightController');

const router = express.Router();
router.use(authController.protect);

router.get('/', flightController.getAllFlights);

router.post(
  '/',
  authController.restrictTo('super-admin'),
  flightController.addFlight,
);
router.post(
  '/booking/:flightId',
  authController.restrictTo('user'),
  authController.restrictToWinnerOrMahrem,
  flightController.bookFlight,
);
module.exports = router;
