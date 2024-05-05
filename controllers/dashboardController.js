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

exports.getDuplicatedList = catchAsync(async (req, res, next) => {
  const adminId = req.user._id;
  const { commune, quota } = await Commune.findOne({
    admin: new ObjectId(adminId),
  });
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
  const adminId = req.user._id;
  const { commune, quota, reservePlace } = await Commune.findOne({
    admin: new ObjectId(adminId),
  });

  const { ageCount, agePercentage } = req.body;
  const { winner, remainingQuota, reserve, remainingReserve } =
    await Registration.performDraw({
      quota,
      commune,
      reservePlace,
      agePercentage,
    });
  const numberOld = await Winner.countWinnersByAge(ageCount);
  //console.log(reserve, remainingReserve, winner);
  // if (remainingQuota === 0 && remainingReserve === 0) {
  //   return next(new AppError('the Draw is finished', 404));
  // }
  // return { winner, remainingQuota, reserve, remainingReserve };
  res.status(201).json({
    status: 'success',
    winners: winner,
    remainingPlaces: remainingQuota,
    reserves: reserve,
    remainingReservePlaces: remainingReserve,
    oldPeople: numberOld,
  });
});

/*exports.executeDraw = catchAsync(async (req, res, next) => {
  const registrationList = await Registration.aggregate([
    {
      $match: {},
    },
    {
      $addFields: {
        arrayField: {
          $map: {
            input: { $range: [0, '$coefficient'] }, // remove quotes around $coefficient
            as: 'el',
            in: '$$el',
          },
        },
      },
    },
    {
      $unwind: '$arrayField',
    },
    {
      $project: {
        arrayField: 0,
        __v: 0,
      },
    },
  ]).then(async (results) => {
    // Create an array to hold the populated documents
    let populatedResults = [];

    // Use array iteration methods to populate the documents
    await Promise.all(
      results.map(async (result) => {
        // Find the document in the original collection using its _id
        let doc = await Registration.findById(result._id);

        // Populate the desired fields
        await doc.populate('user').execPopulate();

        // Add the populated document to the array
        populatedResults.push(doc);
      }),
    );
  });
  //const newList = await registrationList.populate('userId');
  res.status(200).json({
    status: 'success',
    results: populatedResults.length,
    data: populatedResults,
  });
});*/

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
