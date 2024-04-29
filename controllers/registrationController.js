const Registration = require('../models/registrationModel');
const RegistrationHistory = require('../models/registrationHistoryModel');
const Algo = require('../models/algorithmModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
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
  if (req.user.sex === 'female' && !req.body.mahrem)
    return next(new AppError("You can't register without mahrem!", 400));
  const {
    defaultCoefficient,
    ageLimitToApply,
    ageCoefficient,
    registerCoefficient,
  } = await Algo.findOne({});
  const registrations = await RegistrationHistory.getRegistrationsNumber(
    req.user.id,
  );
  const coefficient =
    defaultCoefficient +
    registrations * registerCoefficient +
    (req.user.calculateAge() > ageLimitToApply ? ageCoefficient : 0);
  let mahrem;
  if (req.body.mahrem)
    mahrem = await User.findOne({ nationalNumber: req.body.mahrem });
  if (!mahrem) {
    return next(
      new AppError('There is no user with this national number!', 404),
    );
  }
  if (mahrem.sex === 'female')
    return next(new AppError('Mahrem can not be a female!', 400));

  const registration = await Registration.create({
    user: req.user.id,
    coefficient,
    mahrem,
  });
  res.status(201).json({
    status: 'success',
    data: {
      registration,
    },
  });
});
