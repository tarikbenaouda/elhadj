const express = require('express');
const authController = require('../controllers/authController');
const medicalAppointController = require('../controllers/medicalAppointController');

const router = express.Router();
router.use(authController.protect);
router.use(authController.restrictTo('doctor'));

router
  .get('/patients', medicalAppointController.getAllpatients)
  .get('/:id', medicalAppointController.getMedicalRecord)
  .post(
    '/',
    //authController.checkCurrentPhase,
    medicalAppointController.addMedicalRecord,
  )
  .patch(
    '/:id',
    // authController.checkCurrentPhase,
    medicalAppointController.updateMedicalRecord,
  );

module.exports = router;
