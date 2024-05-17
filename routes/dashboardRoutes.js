const express = require('express');
const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();
router.use(authController.protect);
// adjust admin role for progress bar
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
  authController.checkCurrentPhase,
  authController.restrictTo('admin'),
  dashboardController.getUserParams,
  dashboardController.getDuplicatedList,
);
router.post(
  '/draw',
  authController.checkCurrentPhase,
  authController.restrictTo('admin'),
  dashboardController.getUserParams,
  dashboardController.executeDraw,
);
router.get(
  '/winners',
  dashboardController.getUserParams,
  dashboardController.getAllWinners,
);

router.route('/progressBar').get(dashboardController.getPhases);
router.patch(
  '/progressBar/:id',
  authController.restrictTo('super-admin'),
  dashboardController.updatePhase,
);

router.post(
  '/commune',
  authController.restrictTo('admin'),
  dashboardController.addCommuneParams,
);

module.exports = router;
