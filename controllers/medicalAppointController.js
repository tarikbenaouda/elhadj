const MedicalRecord = require('../models/medicalRecordModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Winner = require('../models/winnersModel');

exports.getAllpatients = catchAsync(async (req, res, next) => {
  let winners = await Winner.getWinnersByCommune(req.user.commune);
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

exports.getAllMedicalRecords = factory.getAll(MedicalRecord, 'Medical Record');
exports.addMedicalRecord = factory.createOne(
  MedicalRecord,
  'Medical Record',
  true,
);
exports.updateMedicalRecord = factory.updateOne(
  MedicalRecord,
  'Medical Record',
  true,
);
// exports.updateMedicalRecord = catchAsync(async (req, res, next) => {
//   const record = await MedicalRecord.findById(req.params.id);
//   if (!record) {
//     return next(new AppError('No Medical record found with that ID', 404));
//   }
//   if (record.creatorId.toString() !== req.user._id.toString()) {
//     return next(
//       new AppError(
//         'You do not have permission to update this Medical record',
//         403,
//       ),
//     );
//   }
//   const medicalRecord = await MedicalRecord.findByIdAndUpdate(
//     req.params.id,
//     {
//       ...req.body,
//     },
//     {
//       new: true,
//       runValidators: true,
//     },
//   );
//   res.status(200).json({
//     status: 'success',
//     data: {
//       data: medicalRecord,
//     },
//   });
// });
exports.assignWinnerToMedicalAppointment = catchAsync(
  async (req, res, next) => {
    const { winnerId, doctorId, date, location } = req.body;
    const winner = await Winner.findByIdAndUpdate(winnerId, {
      medicalAppointment: { doctorId, date, location },
    });
  },
);
