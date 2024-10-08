/* eslint-disable prettier/prettier */
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const APIFeatures = require('../utils/apiFeatures');

const filterObj = (obj, ...disallowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (!disallowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "Cette route n'est pas destinée aux mises à jour de mot de passe. Veuillez utiliser /updateMyPassword.",
        400,
      ),
    );
  }
  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(
    req.body,
    'role',
    'password',
    'passwordConfirm',
    'passwordChangedAt',
  );
  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  let match;
  if (req.user.role === 'manager') {
    match = { wilaya: req.user.wilaya, commune: req.user.commune };
  } else if (req.user.role === 'admin') {
    match = { wilaya: req.user.wilaya };
  }
  const query = User.find(match);

  const features = new APIFeatures(query, req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const users = await features.query;
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      data: users,
    },
  });
});

exports.getUser = factory.getOne(User, 'User');
exports.searchUserByNin = factory.searchByNin(User, 'User');
exports.updateUser = catchAsync(async (req, res, next) => {
  let match;
  if (req.user.role === 'admin') {
    match = { wilaya: req.user.wilaya };
  } else if (req.user.role === 'manager') {
    match = { wilaya: req.user.wilaya, commune: req.user.commune };
  }
  const doc = await User.findByIdAndUpdate(
    req.params.id,
    {
      role: req.body.role,
      match,
      commune: req.body.commune,
    },
    {
      new: true,
      runValidators: false,
    },
  );

  if (!doc) {
    return next(
      new AppError('Aucun utilisateur trouvé avec cet identifiant.', 404),
    );
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: doc,
    },
  });
});
