/* eslint-disable no-undef */
/* eslint-disable prefer-const */
const Algorithm = require('../models/algorithmModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Commune = require('../models/communeModel');
const Registration = require('../models/registrationModel');
const { ObjectId } = require('mongodb');

const duplicateUsers = async (users) => {
  let duplicatedUsers = [];

  users.forEach((user) => {
    const duplicates = Math.max(1, user.coefficient); // Using coefficient from each user, defaulting to 1 if not defined
    duplicatedUsers.push(...Array(duplicates).fill(user));
  });

  return duplicatedUsers;
};
const conductDraw = (duplicatedUsers, quota) => {
  let winnerList = [];
  let reserveList = [];
  let availablePlaces = quota;

  while (availablePlaces > 0) {
    let selectedUser =
      duplicatedUsers[Math.floor(Math.random() * duplicatedUsers.length)];

    if (!winnerList.find((winner) => winner.NIN === selectedUser.NIN)) {
      if (selectedUser.mahrem && availablePlaces >= 2) {
        reserveList.push({
          NIN: selectedUser.NIN,
          mahrem: selectedUser.mahrem,
        });
        availablePlaces -= 2;
      } else {
        winnerList.push({ NIN: selectedUser.NIN });
        availablePlaces -= 1;
      }
    }

    duplicatedUsers = duplicatedUsers.filter(
      (user) => user.NIN !== selectedUser.NIN,
    );
  }
  return { winnerList, reserveList };
};
exports.executeDraw = catchAsync(async (req, res, next) => {
  const adminId = req.user._id;
  const { commune, quota } = await Commune.findOne({
    admin: ObjectId(adminId),
  });
  console.log(commune, quota);

  const registrationList = await Registration.find({
    //'userId.commune': commune,
  });
  const filteredRegistrationList = registrationList.filter(
    (registration) => registration.userId.commune === commune,
  );
  const randomNumber =
    Math.floor(Math.random() * filteredRegistrationList.length) - quota;
  console.log(filteredRegistrationList);
  res.status(201).json({
    status: 'sucess',
    Quota: filteredRegistrationList.slice(randomNumber, randomNumber + quota)
      .length,
    winners: filteredRegistrationList.slice(randomNumber, randomNumber + quota),
  });
});

/*exports.executeDraw = catchAsync(async (req, res, next) => {
  const adminId = req.user._id;
  const selectedCommune = await Commune.findOne({ admin: ObjectId(adminId) });
  // This should be replaced with the commune parameter you want to search for

  const registrationList = await Registration.find({
    'user.commune': selectedCommune,
  }).toArray();

  const duplicatedUsers = await duplicateUsers(registrationList);
  const { winnerList, reserveList } = conductDraw(
    duplicatedUsers,
    selectedCommune.quota,
  );
  res.status(201).json({
    status: 'sucess',
    winners: winnerList,
    reserve: reserveList,
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
