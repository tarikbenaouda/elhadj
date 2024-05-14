const Registration = require('../models/registrationModel');
const RegistrationHistory = require('../models/registrationHistoryModel');
const Algo = require('../models/algorithmModel');
const User = require('../models/userModel');
const Hadj = require('../models/hadjModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllRegistrations = catchAsync(async (req, res, next) => {
  const registrations = await Registration.find({})
    .select('userId coefficient -_id')
    .populate({
      path: 'userId',
      select: 'firstName lastName commune nationalNumber -_id ',
    })
    .lean();
  res.status(200).json({
    status: 'success',
    results: registrations.length,
    data: {
      registrations,
    },
  });
});
exports.register = catchAsync(async (req, res, next) => {
  let mahrem;
  if (req.user.sex === 'female') {
    if (!req.body.mahrem)
      return next(new AppError("You can't register without mahrem!", 400));

    mahrem = await User.findOne({ nationalNumber: req.body.mahrem });
    if (!mahrem)
      return next(
        new AppError('There is no user with this national number!', 404),
      );
    if (mahrem.sex === 'female')
      return next(new AppError('Mahrem can not be a female!', 400));
    if (mahrem.role !== 'user')
      return next(new AppError('Mahrem must be a normal user!', 400));
  }
  const {
    defaultCoefficient,
    ageLimitToApply,
    ageCoefficient,
    registerCoefficient,
    hadjLimitToApply,
  } = await Algo.findOne({});
  // Verification of last hadj
  let hadjYear;
  if (hadjLimitToApply) hadjYear = await Hadj.getLastHadjYear(req.user._id);
  if (
    hadjYear &&
    hadjYear >= new Date(Date.now()).getFullYear() - hadjLimitToApply
  )
    return next(
      new AppError(
        `It has been less than ${hadjLimitToApply} years since your last hadj!`,
        400,
      ),
    );
  const registrations = await RegistrationHistory.getRegistrationsNumber(
    req.user._id,
  );
  // Calcule of age coefficient
  let ageCoef;
  if (!ageLimitToApply) ageCoef = 0;
  else ageCoef = req.user.age > ageLimitToApply ? ageCoefficient : 0;
  const coefficient =
    defaultCoefficient + registrations * registerCoefficient + ageCoef;

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
