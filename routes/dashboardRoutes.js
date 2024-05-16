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
  dashboardController.checkCurrentPhase,
  authController.restrictTo('admin'),
  dashboardController.getUserParams,
  dashboardController.getDuplicatedList,
);
router.post(
  '/draw',
  //dashboardController.checkCurrentPhase,
  authController.restrictTo('admin'),
  dashboardController.getUserParams,
  dashboardController.executeDraw,
);
router.get(
  '/winners',
  dashboardController.getUserParams,
  dashboardController.getAllWinners,
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

router
  .post(
    '/medicalAppointment',
    //dashboardController.checkCurrentPhase,
    authController.restrictTo('doctor'),
    dashboardController.addMedicalRecord,
  )
  .patch(
    '/medicalAppointment/:id',
    //dashboardController.checkCurrentPhase,
    authController.restrictTo('doctor'),
    dashboardController.updateMedicalRecord,
  );
module.exports = router;
