/* eslint-disable no-sparse-arrays */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-undef */
/* eslint-disable prefer-const */
const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const Algorithm = require('../models/algorithmModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Commune = require('../models/communeModel');
const Registration = require('../models/registrationModel');
const Winner = require('../models/winnersModel');
const ProgressBar = require('../models/progressBarModel');
const factory = require('./handlerFactory');

exports.getAlgorithm = factory.getAll(Algorithm);
exports.createAlgorithm = factory.createOne(Algorithm, 'Algorithm', true);
exports.updateAlgorithm = factory.updateOne(Algorithm, 'Algorithm', true);
exports.deleteAlgorithm = factory.deleteOne(Algorithm, 'Algorithm');

exports.getDrawParams = catchAsync(async (req, res, next) => {
  const adminId = req.user._id;
  if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
    return next(new AppError('Invalid admin ID.', 400));
  }
  req.communeData = await Commune.findOne({
    admin: new mongoose.Types.ObjectId(adminId),
  });
  if (!req.communeData) {
    return next(new AppError('No commune found for this admin.', 404));
  }
  next();
});

exports.getDuplicatedList = catchAsync(async (req, res, next) => {
  const { commune } = req.communeData;
  const { agePercentage } = req.body;
  if (!commune || !agePercentage) {
    return next(new AppError('Missing required parameters.', 400));
  }
  if (
    typeof agePercentage !== 'number' ||
    agePercentage < 0 ||
    agePercentage > 150
  ) {
    return next(new AppError('Invalid age percentage.', 400));
  }
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
  if (!commune || !quota || !reservePlace || !ageCount || !agePercentage) {
    return next(new AppError('Missing required parameters.', 400));
  }
  if (
    typeof agePercentage !== 'number' ||
    agePercentage < 0 ||
    agePercentage > 150
  ) {
    return next(new AppError('Invalid age percentage.', 400));
  }
  if (typeof ageCount !== 'number' || ageCount < 0) {
    return next(new AppError('Invalid age count.', 400));
  }
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

exports.getPhases = factory.getAll(ProgressBar);
exports.createPhase = factory.createOne(ProgressBar, 'Phase');
exports.updatePhase = factory.updateOne(ProgressBar, 'Phase');
exports.deletePhase = factory.deleteOne(ProgressBar, 'Phase');
