const express = require('express');
const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();
router.post(
  '/drawList',
  authController.protect,
  authController.restrictTo('admin'),
  dashboardController.getDuplicatedList,
);
router.post(
  '/draw',
  authController.protect,
  authController.restrictTo('admin'),
  dashboardController.executeDraw,
);
router
  //   .get(
  //     '/algorithm',
  //     authController.protect,
  //     authController.restrictTo('admin', 'super-admin'),
  //     dashboardController.getAlgorithm,
  //   )
  .post(
    '/algorithm',
    authController.protect,
    authController.restrictTo('super-admin'),
    dashboardController.createAlgorithm,
  )
  .patch(
    '/algorithm/:id',
    authController.protect,
    authController.restrictTo('super-admin'),
    dashboardController.updateAlgorithm,
  )
  .delete(
    '/algorithm/:id',
    authController.protect,
    authController.restrictTo('super-admin'),
    dashboardController.deleteAlgorithm,
  );

module.exports = router;
