/* eslint-disable import/no-extraneous-dependencies */
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Winner = require('../models/winnersModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id, exp) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: exp || process.env.JWT_EXPIRES_IN,
  });
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
// Sign up function
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    // role: req.body.role, // Do not add this line. The role is set by default to "user".
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    nationalNumber: req.body.nationalNumber,
    birthdate: req.body.birthdate,
    wilaya: req.body.wilaya,
    commune: req.body.commune,
    address: req.body.address,
    phone: req.body.phone,
    sex: req.body.sex,
  });

  createSendToken(newUser, 201, res);
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
  createSendToken(user, 200, res);
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
  // User changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat))
    return next(
      new AppError('User recently changed password please log in again', 401),
    );
  req.user = currentUser;

  next();
});
// Use this middleware to specify who can access (role) a route .
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError('You do not have permission to perform this action', 403), // forbidden
      );
    next();
  };
// This will handle the forgot password request
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError('There is no user with that email address.', 404));
  // 2) Generate the random reset token
  const resetToken = await user.createPasswordResetToken();
  const message = `Here is your password reset OTP: ${resetToken}`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your Password reset token (valid for 10 mins).',
      text: message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Token sent to your email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was a problem sending the email please try again later.',
        500,
      ),
    );
  }
});
exports.verifyOTP = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return next(new AppError('Please provide email and otp!', 400));
  }
  const user = await User.findOne({ email });
  if (!user)
    return next(new AppError('There is no user with that email address.', 404));
  if (!user.verifyOTP(otp)) return next(new AppError('Incorrect OTP', 401));
  if (Date.now() > user.passwordResetExpires)
    return next(new AppError('OTP expired', 401));
  createSendToken(user, 200, res);
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { user } = req;

  await user.changePassword(req.body.password, req.body.passwordConfirm);
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user._id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createSendToken(user, 200, res);
});

exports.restrictToWinnerOrMahrem = catchAsync(async (req, res, next) => {
  const winner = await Winner.findOne({
    $or: [{ userId: req.user._id }, { mahrem: req.user._id }],
  });
  if (!winner)
    return next(
      new AppError('You are not allowed to perform this action', 403),
    );
  next();
});
