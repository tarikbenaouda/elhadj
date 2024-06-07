const express = require('express');
const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');
//const router = express.Router({ mergeParams: true });
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
  );

router
  .route('/algorithm/:id')
  .patch(
    authController.restrictTo('super-admin'),
    dashboardController.updateAlgorithm,
  )
  .delete(
    authController.restrictTo('super-admin'),
    dashboardController.deleteAlgorithm,
  );

router.post(
  '/drawList',
  // authController.checkCurrentPhase,
  dashboardController.getUserParams,
  dashboardController.getDuplicatedList,
);
router.post(
  '/draw',
  // authController.checkCurrentPhase,
  authController.restrictTo('manager'),
  dashboardController.getUserParams,
  dashboardController.executeDraw,
);
router.get('/winners', dashboardController.getAllWinners);

router.route('/progressBar').get(dashboardController.getPhases);
router.patch(
  '/progressBar/:id',
  authController.restrictTo('super-admin'),
  dashboardController.updatePhase,
);

router
  .route('/communeParams')
  .get(authController.restrictTo('admin'), dashboardController.getAllCommune)
  .post(
    authController.restrictTo('admin'),
    dashboardController.addCommuneParams,
  );

router
  .route('/wilayaParams')
  .get(
    authController.restrictTo('super-admin'),
    dashboardController.getAllWilaya,
  )
  .post(
    authController.restrictTo('super-admin'),
    dashboardController.addWilayaParams,
  );

router
  .route('/healthCenters')
  .get(dashboardController.getAllHealthCenters)
  .post(
    authController.restrictTo('manager'),
    dashboardController.addHealthCenter,
  );
router.patch(
  '/healthCenters/:id',
  authController.restrictTo('manager'),
  dashboardController.updateHealthCenter,
);

router
  .route('/postes')
  .get(dashboardController.getAllPostes)
  .post(authController.restrictTo('manager'), dashboardController.addPoste);
router.patch(
  '/postes/:id',
  authController.restrictTo('manager'),
  dashboardController.updatePoste,
);
router.get(
  '/statistics',
  authController.restrictTo('super-admin', 'admin', 'manager'),
  dashboardController.getStatistics,
);

router.get('/test', dashboardController.test);

module.exports = router;
