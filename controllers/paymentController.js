const User = require('../models/userModel');
const Winner = require('../models/winnersModel');
const Payment = require('../models/paymentModel');
const Post = require('../models/postModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllPayments = catchAsync(async (req, res, next) => {
  const { commune } = req.user;
  const [winners, payments] = await Promise.all([
    Winner.getWinnersByCommuneOrWilaya({ commune }),
    Payment.getPaymentsByCommune(commune),
  ]);
  winners.forEach((winner) => {
    const payment = payments.find((p) => p.userId.equals(winner.userId));
    if (payment) {
      winner.payment = payment.refunded ? 'refunded' : 'paid';
      winner.paymentDetails = payment;
    } else {
      winner.payment = 'not-paid';
    }
  });
  res.status(200).json({
    status: 'success',
    results: winners.length,
    data: winners,
  });
});
exports.pay = catchAsync(async (req, res, next) => {
  if (!req.body.nationalNumber || !req.body.amount)
    return next(new AppError('National number and amount are required', 400));
  const userId = await User.findOne({
    nationalNumber: req.body.nationalNumber,
  }).select('_id firstName lastName email birthdate commune');

  const isWinner = await Winner.checkUserInWinnerModel(userId._id);
  const isMahrem = await Winner.findOne({ mahrem: userId._id });

  if (!isWinner && !isMahrem) return next(new AppError('User not found', 404));

  const alreadyPaid = await Payment.findOne({ userId: userId._id });
  if (alreadyPaid) {
    if (alreadyPaid.refunded === false)
      return next(new AppError('User already paid', 400));
    if (alreadyPaid.refunded === true)
      return next(new AppError('User already refunded', 400));
  }
  if (req.body.confirm) {
    const post = await Post.findOne({ postman: req.user._id }).lean();
    const payment = (
      await Payment.create({
        postman: req.user._id,
        amount: req.body.amount,
        userId: userId._id,
        post: post._id,
      })
    ).toObject();
    // adding payment field to winner document
    let winner = await Winner.findOne({ userId: userId._id });

    if (winner) winner.payment = payment._id;
    else {
      winner = await Winner.findOne({ mahrem: userId._id });
      winner.mahremPayment = payment._id;
    }
    await winner.save();
    const user = await User.findById(userId._id)
      .select('firstName lastName email birthdate nationalNumber paiment')
      .lean();
    user.payment = 'paid';
    user.paymentDetails = {
      ...payment,
      _id: undefined,
      __v: undefined,
    };
    user.paymentDetails.postInfo = {
      ...post,
      postman: undefined,
      _id: undefined,
      __v: undefined,
    };
    return res.status(201).json({
      status: 'success',
      data: user,
    });
  }
  res.status(200).json({
    status: 'success',
    data: userId,
  });
});

// Refund function
exports.refund = catchAsync(async (req, res, next) => {
  if (!req.body.nationalNumber)
    return next(new AppError('National number is required', 400));
  const userId = await User.findOne({
    nationalNumber: req.body.nationalNumber,
  }).select('_id commune');
  const isWinner = await Winner.checkUserInWinnerModel(userId._id);
  if (!isWinner || userId.commune !== req.user.commune)
    return next(new AppError('User not found', 404));
  const payment = await Payment.findOne({ userId: userId._id });
  if (!payment) return next(new AppError('User not paid', 400));
  if (payment.refunded)
    return next(new AppError('Payment already refunded', 400));
  payment.refunded = true;
  await payment.save();
  res.status(200).json({
    status: 'success',
    data: payment,
  });
});
