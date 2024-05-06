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
  dashboardController.getDrawParams,
  authController.restrictTo('admin'),
  dashboardController.getDuplicatedList,
);
router.post(
  '/draw',
  dashboardController.getDrawParams,
  authController.restrictTo('admin'),
  dashboardController.executeDraw,
);

router
  .route('/progressBar')
  .get(dashboardController.getPhases)
  .post(
    authController.restrictTo('super-admin'),
    dashboardController.createPhase,
  );
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
