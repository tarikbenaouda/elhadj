const express = require('express');
const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();
router.use(authController.protect);

router
  .get(
    '/algorithm',
    authController.restrictTo('admin', 'super-admin'),
    dashboardController.getAlgorithm,
  )
  .post(
    '/algorithm',
    authController.restrictTo('super-admin'),
    dashboardController.createAlgorithm,
  )
  .patch(
    '/algorithm/:id',
    authController.restrictTo('super-admin'),
    dashboardController.updateAlgorithm,
  )
  .delete(
    '/algorithm/:id',
    authController.restrictTo('super-admin'),
    dashboardController.deleteAlgorithm,
  );

router.use(dashboardController.getDrawParams);
router.post(
  '/drawList',
  authController.restrictTo('admin'),
  dashboardController.getDuplicatedList,
);
router.post(
  '/draw',
  authController.restrictTo('admin'),
  dashboardController.executeDraw,
);
module.exports = router;
