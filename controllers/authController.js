/* eslint-disable import/no-extraneous-dependencies */
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

// Sign up function
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    nationalNumber: req.body.nationalNumber,
    birthdate: req.body.birthdate,
    wilaya: req.body.wilaya,
    commune: req.body.commune,
    address: req.body.address,
    phone: req.body.phone,
    sexe: req.body.sexe,
  });

  const token = signToken(newUser._id);
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});
// Log in function
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  const user = await User.findOne({ email }).select('+password');
  if (!user) return next(new AppError('Incorrect email or password', 401));
  const correct = await user.correctPassword(password, user.password);
  if (!correct) return next(new AppError('Incorrect email or password', 401));
  const token = signToken(user._id);
  res.status(201).json({
    status: 'success',
    token,
  });
});

// Use it as middleware to check if user is logged in or not
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  )
    token = req.headers.authorization.split(' ')[1];
  if (!token) return next(new AppError('You are not logged in .', 401));
  // Token verification
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // User still exist ?
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401,
      ),
    );
  // User changed password after the token was issuled
  if (currentUser.changedPasswordAfter(decoded.iat))
    return next(
      new AppError('User recently changed password please log in again', 401),
    );
  req.user = currentUser;
  next();
});
