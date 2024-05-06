/* eslint-disable no-sparse-arrays */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-undef */
/* eslint-disable prefer-const */
const { ObjectId } = require('mongodb');
const Algorithm = require('../models/algorithmModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Commune = require('../models/communeModel');
const Registration = require('../models/registrationModel');
const Winner = require('../models/winnersModel');

exports.getDrawParams = catchAsync(async (req, res, next) => {
  const adminId = req.user._id;
  req.communeData = await Commune.findOne({
    admin: new ObjectId(adminId),
  });
  next();
});

exports.getDuplicatedList = catchAsync(async (req, res, next) => {
  const { commune, quota } = req.communeData;
  const { agePercentage } = req.body;
  const drawPool = await Registration.getDrawPool(commune, agePercentage);
  if (!drawPool) {
    return next(new AppError('Draw pool is empty.', 404));
  }
  res.status(200).json({
    status: 'success',
    results: drawPool.length,
    data: drawPool,
  });
});

exports.executeDraw = catchAsync(async (req, res, next) => {
  const { commune, quota, reservePlace } = req.communeData;
  const { ageCount, agePercentage } = req.body;
  const { winner, remainingQuota, reserve, remainingReserve } =
    await Registration.performDraw({
      quota,
      commune,
      reservePlace,
      agePercentage,
    });
  const numberOld = await Winner.countWinnersByAge(ageCount);
  if (remainingQuota === 0 && remainingReserve === 0 && !reserve) {
    return next(new AppError('the Draw is finished', 404));
  }
  res.status(201).json({
    status: 'success',
    winners: winner,
    remainingPlaces: remainingQuota,
    reserves: reserve,
    remainingReservePlaces: remainingReserve,
    oldPeople: numberOld,
  });
});

exports.createAlgorithm = catchAsync(async (req, res, next) => {
  const newAlgorithm = await Algorithm.create({
    creatorId: req.user._id,
    defaultCoefficient: req.body.defaultCoefficient,
    ageLimitToApply: req.body.ageLimitToApply,
    percentageOfQuota: req.body.percentageOfQuota,
    include: req.body.include,
    ageCoefficient: req.body.ageCoefficient,
    registerCoefficient: req.body.registerCoefficient,
    hadjLimitToApply: req.body.hadjLimitToApply,
    permit: req.body.permit,
    penaltyCoefficient: req.body.penaltyCoefficient,
  });
  if (!newAlgorithm) {
    return next(new AppError('Algorithm has not been created', 404));
  }
  res.status(201).json({
    status: 'success',
    data: newAlgorithm,
  });
});
exports.updateAlgorithm = catchAsync(async (req, res, next) => {
  const algorithmId = req.params.id;
  const updateAlgorithm = await Algorithm.findByIdAndUpdate(
    algorithmId,
    {
      creatorId: req.user._id,
      defaultCoefficient: req.body.defaultCoefficient,
      ageLimitToApply: req.body.ageLimitToApply,
      percentageOfQuota: req.body.percentageOfQuota,
      include: req.body.include,
      ageCoefficient: req.body.ageCoefficient,
      registerCoefficient: req.body.registerCoefficient,
      hadjLimitToApply: req.body.hadjLimitToApply,
      permit: req.body.permit,
      penaltyCoefficient: req.body.penaltyCoefficient,
    },
    { new: true }, // Return the updated document
  );
  if (!updateAlgorithm) {
    return next(new AppError('Algorithm not found', 404));
  }
  res.status(200).json({
    status: 'success',
    data: updateAlgorithm,
  });
});

exports.deleteAlgorithm = catchAsync(async (req, res, next) => {
  const algorithmId = req.params.id;

  const deletedAlgorithm = await Algorithm.findByIdAndDelete(algorithmId);

  if (!deletedAlgorithm) {
    return next(new AppError('Algorithm not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
