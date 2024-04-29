const Algorithm = require('../models/algorithmModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

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
  console.log(algorithmId);
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
