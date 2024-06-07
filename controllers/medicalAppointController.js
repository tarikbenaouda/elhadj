const MedicalRecord = require('../models/medicalRecordModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Winner = require('../models/winnersModel');

exports.getAllpatients = catchAsync(async (req, res, next) => {
  let winners = await Winner.getWinnersByCommuneOrWilaya({
    commune: req.user.commune,
  });
  winners = await Promise.all(
    winners.map(async (winner) => {
      const medicalAppointment = await MedicalRecord.findOne({
        patient: winner.userId,
      });
      const mahremAppointment = await MedicalRecord.findOne({
        patient: winner.mahrem,
      });
      const mahremExist = Boolean(winner.mahrem);
      if (medicalAppointment) {
        winner.consulted = true;
      } else {
        winner.consulted = false;
      }
      if (mahremAppointment) {
        winner.mahremConsulted = true;
      } else if (mahremExist && !mahremAppointment) {
        winner.mahremConsulted = false;
      }
      return winner;
    }),
  );
  res.status(200).json({
    status: 'success',
    length: winners.length,
    data: {
      data: winners,
    },
  });
});
exports.getMedicalRecord = catchAsync(async (req, res, next) => {
  const record = await MedicalRecord.findOne({ patient: req.params.id });
  if (!record) {
    return next(
      new AppError('Aucun dossier médical trouvé avec cet identifiant.', 404),
    );
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
    return next(new AppError("Le dossier médical n'a pas été créé.", 404));
  }

  const winner = await Winner.findOne({
    $or: [{ userId: record.patient }, { mahrem: record.patient }],
  });
  const checkMahrem = winner.isMahrem(record.patient);
  console.log(checkMahrem);
  if (checkMahrem) {
    winner.mahremMedicalRecord = record._id;
    console.log('mahrem', winner);
    await winner.save();
  } else {
    console.log('winner', winner);
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

exports.updateMedicalRecord = factory.updateOne(
  MedicalRecord,
  'Medical Record',
  true,
);
