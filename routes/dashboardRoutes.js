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

router.post(
  '/drawList',
  dashboardController.checkCurrentPhase,
  authController.restrictTo('admin'),
  dashboardController.getDrawParams,
  dashboardController.getDuplicatedList,
);
router.post(
  '/draw',
  dashboardController.checkCurrentPhase,
  authController.restrictTo('admin'),
  dashboardController.getDrawParams,
  dashboardController.executeDraw,
);
router.get('/winners', dashboardController.getAllWinners);

router
  .route('/progressBar')
  .get(dashboardController.getPhases)
  .post(authController.restrictTo('admin'), dashboardController.createPhase);
router
  .route('/progressBar/:id')
  .patch(
    authController.restrictTo('super-admin'),
    dashboardController.updatePhase,
  )
  .delete(
    authController.restrictTo('super-admin'),
    dashboardController.deletePhase,
  );
module.exports = router;
