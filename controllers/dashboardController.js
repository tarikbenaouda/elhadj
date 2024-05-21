/* eslint-disable no-sparse-arrays */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-undef */
/* eslint-disable prefer-const */
const mongoose = require('mongoose');
const Algorithm = require('../models/algorithmModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Commune = require('../models/communeModel');
const Registration = require('../models/registrationModel');
const Winner = require('../models/winnersModel');
const ProgressBar = require('../models/progressBarModel');
const Wilaya = require('../models/wilayaModel');
const HealthCenter = require('../models/healthCentersModel');
const Post = require('../models/postModel');
const factory = require('./handlerFactory');

exports.getAlgorithm = factory.getAll(Algorithm);
exports.createAlgorithm = factory.createOne(Algorithm, 'Algorithm', true);
exports.deleteAlgorithm = factory.deleteOne(Algorithm, 'Algorithm');
exports.updateAlgorithm = catchAsync(async (req, res, next) => {
  const algorithmId = req.params.id;
  const {
    oldStartAge,
    newStartAge,
    newEndAge,
    newPercentageOfQuota,
    ...otherFields
  } = req.body;

  const algorithm = await Algorithm.findOneAndUpdate(
    { _id: algorithmId, 'ageCategories.startAge': oldStartAge },
    {
      $set: {
        ...otherFields,
        'ageCategories.$.startAge': newStartAge,
        'ageCategories.$.endAge': newEndAge,
        'ageCategories.$.percentageOfQuota': newPercentageOfQuota,
      },
    },
    { new: true, runValidators: true },
  );

  if (!algorithm) {
    return next(new AppError('No algorithm found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      algorithm,
    },
  });
});

exports.getUserParams = catchAsync(async (req, res, next) => {
  const managerId = req.user._id;
  if (!managerId || !mongoose.Types.ObjectId.isValid(managerId)) {
    return next(new AppError('Invalid admin ID.', 400));
  }
  const commune = await Commune.findOne({
    manager: new mongoose.Types.ObjectId(managerId),
  });
  await commune.calculatePlacesForEachCategory();
  req.communeData = commune;
  if (!req.communeData) {
    return next(new AppError('No commune found for this admin.', 404));
  }
  next();
});

exports.getDuplicatedList = catchAsync(async (req, res, next) => {
  const { commune } = req.communeData;
  if (!commune) {
    return next(new AppError('Missing required parameters.', 400));
  }
  const drawPool = await Registration.getDrawPool(commune);
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
  const { commune, quota, reservePlace, placesForEachCategory, ageCategories } =
    req.communeData;

  if (!commune || !quota || !reservePlace) {
    return next(new AppError('Missing required parameters.', 400));
  }
  const { winner, remainingQuota, reserve, remainingReserve, drawPool } =
    await Registration.performDraw({
      quota,
      commune,
      reservePlace,
      //oldQuotaAge,
      //placesForEachCategory,
      //ageCategories,
      page: 1,
      limit: 151,
    });
  // const numberOld = await Winner.countWinnersByAge(ageCount);
  if (remainingQuota === 0 && remainingReserve === 0 && !reserve) {
    return next(new AppError('the Draw is finished', 404));
  }
  res.status(201).json({
    status: 'success',
    winners: winner,
    remainingPlaces: remainingQuota,
    reserves: reserve,
    remainingReservePlaces: remainingReserve,
    //   length: drawPool.length,
    drawList: drawPool,
  });
});

exports.getAllWinners = catchAsync(async (req, res, next) => {
  const { commune } = req.communeData;
  const winners = await Winner.find()
    .select('userId coefficient mahrem -_id')
    .populate({
      path: 'userId',
      match: { commune: commune }, // filter based on commune
      select: 'firstName lastName commune nationalNumber email -_id ',
    })
    .populate({
      path: 'mahrem',
      select: 'firstName lastName -_id',
    })
    .lean();
  res.status(200).json({
    status: 'success',
    results: winners.length,
    data: {
      winners,
    },
  });
});

exports.getPhases = factory.getAll(ProgressBar);
exports.updatePhase = factory.updateOne(ProgressBar, 'Phase');

exports.addCommuneParams = catchAsync(async (req, res, next) => {
  const { commune, quota, reservePlace, oldPeopleQuota } = req.body;
  if (!commune) {
    return next(new AppError('Missing Commune parameters.', 400));
  }
  const updatedCommune = await Commune.findOneAndUpdate(
    { commune: commune },
    {
      $set: {
        quota: quota,
        reservePlace: reservePlace,
        oldPeopleQuota: oldPeopleQuota,
      },
    },
    { new: true, runValidators: true },
  );
  res.status(201).json({
    status: 'success',
    data: {
      updatedCommune,
    },
  });
});
exports.getAllCommune = factory.getAll(Commune, {
  path: 'manager',
  select: 'firstName lastName  -_id',
});

exports.addWilayaParams = catchAsync(async (req, res, next) => {
  const { name, quota, oldPeopleQuota } = req.body;
  if (!name) {
    return next(new AppError('Missing Wilaya name.', 400));
  }
  const updatedWilaya = await Wilaya.findOneAndUpdate(
    {
      name: name,
    },
    {
      $set: {
        quota: quota,
        oldPeopleQuota: oldPeopleQuota,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );
  res.status(201).json({
    status: 'success',
    data: {
      updatedWilaya,
    },
  });
});
exports.getAllWilaya = factory.getAll(Wilaya, {
  path: 'admin',
  select: 'firstName lastName  -_id',
});

exports.getAllHealthCenters = factory.getAll(HealthCenter, {
  path: 'doctors',
  select: 'firstName lastName -_id',
});
exports.addHealthCenter = factory.createOne(HealthCenter, 'HealthCenter');
exports.updateHealthCenter = factory.updateOne(HealthCenter, 'HealthCenter');

exports.getAllPostes = factory.getAll(Post);
exports.addPoste = factory.createOne(Post, 'Poste');
exports.updatePoste = factory.updateOne(Post, 'Poste');
