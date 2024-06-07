const Registration = require('../models/registrationModel');
const RegistrationHistory = require('../models/registrationHistoryModel');
const Algo = require('../models/algorithmModel');
const User = require('../models/userModel');
const Hadj = require('../models/hadjModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllRegistrations = catchAsync(async (req, res, next) => {
  let match = {};
  switch (req.user.role) {
    case 'manager':
      match = {
        'user.commune': req.user.commune,
      };
      break;
    case 'admin':
      match = {
        'user.wilaya': req.user.wilaya,
      };
      break;
    default:
      break;
  }

  const registrations = await Registration.aggregate([
    {
      $lookup: {
        from: 'users', // replace with the actual name of the user collection
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
    {
      $match: match,
    },
    {
      $addFields: {
        firstName: '$user.firstName',
        lastName: '$user.lastName',
        commune: '$user.commune',
        nationalNumber: '$user.nationalNumber',
      },
    },
    {
      $project: {
        _id: 0,
        user: 0,
        __v: 0,
        userId: 0,
      },
    },
  ]);

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
      return next(
        new AppError('Vous ne pouvez pas vous inscrire sans mahrem!', 400),
      );

    mahrem = await User.findOne({ nationalNumber: req.body.mahrem });
    if (!mahrem)
      return next(
        new AppError(
          "Il n'y a pas d'utilisateur avec ce numéro national!",
          404,
        ),
      );
    if (mahrem.sex === 'female')
      return next(new AppError('Mahrem ne peut pas être une femme!', 400));
    if (mahrem.role !== 'user')
      return next(new AppError('Mahrem doit être un utilisateur normal!', 400));
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
        `Il y a moins de ${hadjLimitToApply} ans depuis votre dernier Hadj !
        Vous pouvez vous inscrire après ${hadjYear >= new Date(Date.now()).getFullYear() - hadjLimitToApply} ans.`,
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
    return next(new AppError('Vous êtes déjà inscrit !', 400));
  }
});
