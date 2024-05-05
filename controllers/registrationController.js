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
    req.user._id,
  );
  const coefficient =
    defaultCoefficient +
    registrations * registerCoefficient +
    (req.user.age > ageLimitToApply ? ageCoefficient : 0);
  let mahrem;
  if (req.body.mahrem)
    mahrem = await User.findOne({ nationalNumber: req.body.mahrem });
  if (req.user.sex === 'female' && !mahrem) {
    return next(
      new AppError('There is no user with this national number!', 404),
    );
  }
  if (req.user.sex === 'female' && mahrem.sex === 'female')
    return next(new AppError('Mahrem can not be a female!', 400));
  try {
    const registration = await Registration.create({
      userId: req.user._id,
      coefficient,
      mahrem: mahrem ? mahrem._id : undefined,
    });
    res.status(201).json({
      status: 'success',
      data: {
        registration,
      },
    });
  } catch (err) {
    return next(new AppError('You have already registered!', 400));
  }
});
