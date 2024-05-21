const MedicalRecord = require('../models/medicalRecordModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Winner = require('../models/winnersModel');

exports.getAllpatients = catchAsync(async (req, res, next) => {
  let winners = await Winner.getWinnersByCommuneOrWilaya(req.user.commune);
  winners = await Promise.all(
    winners.map(async (winner) => {
      const medicalAppointment = await MedicalRecord.findOne({
        patient: winner.userId,
      });
      if (medicalAppointment) {
        winner.consulted = true;
      } else {
        winner.consulted = false;
      }
      return winner;
    }),
  );

  res.status(200).json({
    status: 'success',
    data: {
      results: winners.length,
      data: winners,
    },
  });
});
exports.getMedicalRecord = catchAsync(async (req, res, next) => {
  const record = await MedicalRecord.findOne({ patient: req.params.id });
  if (!record) {
    return next(new AppError('No Medical record found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      data: record,
    },
  });
});

exports.addMedicalRecord = catchAsync(async (req, res, next) => {
  const record = await MedicalRecord.create({
    creatorId: req.user._id,
    ...req.body,
  });
  if (!record) {
    return next(new AppError(' Medical Record has not been created ', 404));
  }

  // Find the winner with the same userId as the patientId in the medical record
  const winner = await Winner.findOne({ userId: record.patient });

  // If a winner is found, update their medicalRecord field with the ID of the new medical record
  if (winner) {
    winner.medicalRecord = record._id;
    await winner.save();
  }

  res.status(201).json({
    status: 'success',
    data: {
      data: record,
    },
  });
});

// exports.addMedicalRecord = factory.createOne(
//   MedicalRecord,
//   'Medical Record',
//   true,
// );
exports.updateMedicalRecord = factory.updateOne(
  MedicalRecord,
  'Medical Record',
  true,
);
