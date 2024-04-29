const Registration = require('../models/registrationModel');
const RegistrationHistory = require('../models/registrationHistoryModel');
const Algo = require('../models/algorithmModel');
const catchAsync = require('../utils/catchAsync');

exports.getAllRegistrations = catchAsync(async (req, res, next) => {
  const registrations = await Registration.find({});
  res.status(200).json({
    status: 'success',
    results: registrations.length,
    data: {
      registrations,
    },
  });
});
exports.register = catchAsync(async (req, res, next) => {
  const {
    defaultCoefficient,
    ageLimitToApply,
    ageCoefficient,
    registerCoefficient,
  } = await Algo.findOne({});
  // const defaultCoefficient = 1;
  // const ageLimitToApply = 60;
  // const ageCoefficient = 1;
  // const registrationCoefficient = 1;
  const registrations = await RegistrationHistory.getRegistrationsNumber(
    req.user.id,
  );
  const coefficient =
    defaultCoefficient +
    registrations * registerCoefficient +
    (req.user.calculateAge() > ageLimitToApply ? ageCoefficient : 0);

  const registration = await Registration.create({
    user: req.user.id,
    coefficient,
    mahrem: req.body.mahrem ? req.body.mahrem : undefined,
  });
  res.status(201).json({
    status: 'success',
    data: {
      registration,
    },
  });
});
