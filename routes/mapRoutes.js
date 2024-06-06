const express = require('express');
const authController = require('../controllers/authController');
const mapController = require('../controllers/mapController');

const router = express.Router();

router.use(authController.protect);
router.get('/', mapController.getPositions);

module.exports = router;
