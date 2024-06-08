/* eslint-disable no-lonely-if */
/* eslint-disable prefer-destructuring */
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
const User = require('../models/userModel');
const Hadj = require('../models/hadjModel');
const Winner = require('../models/winnersModel');
const ProgressBar = require('../models/progressBarModel');
const Wilaya = require('../models/wilayaModel');
const HealthCenter = require('../models/healthCentersModel');
const Post = require('../models/postModel');
const factory = require('./handlerFactory');

const getCurrentDate = () =>
  process.env.TEST_CURRENT_DATE
    ? new Date(process.env.TEST_CURRENT_DATE)
    : new Date();

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

  const updateFields = {
    ...otherFields,
  };
  if (newStartAge !== undefined) {
    updateFields['ageCategories.$.startAge'] = newStartAge;
  }

  if (newEndAge !== undefined) {
    updateFields['ageCategories.$.endAge'] = newEndAge;
  }

  if (newPercentageOfQuota !== undefined) {
    updateFields['ageCategories.$.percentageOfQuota'] = newPercentageOfQuota;
  }
  const query = { _id: algorithmId };
  if (oldStartAge !== undefined) {
    query['ageCategories.startAge'] = oldStartAge;
  }
  const algorithm = await Algorithm.findOneAndUpdate(
    query,
    { $set: updateFields },
    { new: true, runValidators: true },
  );
  if (!algorithm) {
    return next(
      new AppError('Aucun algorithme trouvé avec cet identifiant.', 404),
    );
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
    return next(new AppError('Identifiant administrateur invalide.', 400));
  }
  const commune = await Commune.findOne({
    manager: new mongoose.Types.ObjectId(managerId),
  });
  await commune.calculatePlacesForEachCategory();
  req.communeData = commune;
  if (!req.communeData) {
    return next(
      new AppError('Aucune commune trouvée pour cet administrateur.', 404),
    );
  }
  next();
});

exports.getDuplicatedList = catchAsync(async (req, res, next) => {
  const { commune } = req.communeData;
  if (!commune) {
    return next(new AppError('Paramètres requis manquants.', 400));
  }
  const drawPool = await Registration.getDrawPool(commune);
  if (!drawPool) {
    return next(new AppError('Le pool de tirage est vide.', 404));
  }
  res.status(200).json({
    status: 'success',
    results: drawPool.length,
    data: drawPool,
  });
});

exports.executeDraw = catchAsync(async (req, res, next) => {
  const {
    commune,
    quota,
    reservePlace,
    placesForEachCategory,
    ageCategories,
    oldPeopleQuota,
  } = req.communeData;

  console.log('oldPeopleQuota', oldPeopleQuota);
  if (!commune || !quota || !reservePlace) {
    return next(new AppError('Paramètres requis manquants.', 400));
  }
  const { winner, remainingQuota, reserve, remainingReserve, drawPool } =
    await Registration.performDraw({
      quota,
      commune,
      reservePlace,
      // placesForEachCategory,
      // ageCategories,
      page: 1,
      limit: 150,
    });

  const ageRanges = [
    { min: 18, max: 30 },
    { min: 31, max: 40 },
    { min: 41, max: 50 },
    { min: 51, max: 60 },
    { min: 61, max: 70 },
    { min: 71 },
  ];

  const counts = await Promise.all(
    ageRanges.map(({ min, max }) => Winner.countWinnersByAge(min, max)),
  );

  if (remainingQuota === 0 && remainingReserve === 0 && !reserve) {
    return next(new AppError('Le tirage est terminé.', 404));
  }

  res.status(201).json({
    status: 'success',
    winners: winner,
    remainingPlaces: remainingQuota,
    reserves: reserve,
    remainingReservePlaces: remainingReserve,
    drawList: drawPool,
    ...ageRanges.reduce((acc, { min, max }, i) => {
      acc[`age${min}to${max || ''}`] = counts[i];
      return acc;
    }, {}),
  });
});

exports.getAllWinners = catchAsync(async (req, res, next) => {
  let commune;
  let wilaya;
  if (req.user.role === 'admin') {
    wilaya = req.user.wilaya;
  } else if (req.user.role === 'manager') {
    commune = req.user.commune;
  }
  const winners = await Winner.getWinnersByCommuneOrWilaya(
    { commune },
    { wilaya },
  );
  res.status(200).json({
    status: 'success',
    results: winners.length,
    data: {
      winners,
    },
  });
});

function handleMedicalPhase(winner, phases, isMahrem) {
  if (isMahrem) {
    if (!winner.mahremMedicalRecord) {
      phases.passMedicalRecord =
        'you are registered as a mahrem and you have not passed the medical record yet';
    } else if (winner.mahremMedicalRecord.accepted) {
      phases.passMedicalRecord =
        'you are registered as a mahrem and you have passed the medical record';
    } else {
      phases.passMedicalRecord =
        'you are registered as a mahrem and you were refused by the medical record';
    }
  } else {
    if (!winner.medicalRecord) {
      phases.passMedicalRecord = 'you have not passed the medical record yet';
    } else if (winner.medicalRecord.accepted) {
      phases.passMedicalRecord = 'you have passed the medical record';
    } else {
      phases.passMedicalRecord = 'you were refused by the medical record';
    }
  }
}

function handlePaymentPhase(winner, phases, isMahrem) {
  if (isMahrem) {
    if (!winner.mahremPayment) {
      phases.passPaiment =
        'you are registered as a mahrem and you have not paid yet';
    } else if (winner.mahremPayment.refunded) {
      phases.passPaiment =
        'you are registered as a mahrem and you have been refunded';
    } else {
      phases.passPaiment = 'you are registered as a mahrem and you have paid';
    }
  } else {
    if (!winner.payment) {
      phases.passPaiment = 'you have not paid yet';
    } else if (winner.payment.refunded) {
      phases.passPaiment = 'you have been refunded';
    } else {
      phases.passPaiment = 'you have paid';
    }
  }
}

exports.getPhases = catchAsync(async (req, res, next) => {
  const phases = await ProgressBar.find().sort({ startDate: 1 }).lean();

  if (req.user.role === 'user') {
    const currentPhase = await ProgressBar.findOne({
      status: 'current',
    }).lean();

    if (
      currentPhase.phaseName === 'Inscription de Hadj' ||
      currentPhase.phaseName === 'Tirage au Sort'
    ) {
      const registration = await Registration.findOne({
        $or: [{ userId: req.user._id }, { mahrem: req.user._id }],
      }).lean();

      phases.registration = registration
        ? 'you are registered'
        : 'you are not registered';
    } else {
      const winner = await Winner.findOne({
        $or: [{ userId: req.user._id }, { mahrem: req.user._id }],
      }).populate([
        {
          path: 'medicalRecord',
          select: 'accepted -_id',
        },
        {
          path: 'mahremMedicalRecord',
          select: 'accepted -_id',
        },
        {
          path: 'payment',
          select: 'refunded -_id',
        },
        {
          path: 'mahremPayment',
          select: 'refunded -_id',
        },
      ]);
      console.log('winner', winner);
      if (!winner) {
        phases.checkWinner = true;
      } else {
        const isMahrem = winner.isMahrem(req.user._id);
        if (currentPhase.phaseName === 'Visite Médicale') {
          handleMedicalPhase(winner, phases, isMahrem);
        } else if (currentPhase.phaseName === 'Paiement de Frais de Hadj') {
          handlePaymentPhase(winner, phases, isMahrem);
        }
      }
    }
  }
  const modifiedCurrentDate = getCurrentDate();
  console.log(modifiedCurrentDate);
  res.status(200).json({
    status: 'success',
    results: phases.length,
    data: {
      phases,
      currentDate: modifiedCurrentDate,
      checkWinner: phases.checkWinner,
      registration: phases.registration,
      passMedicalRecord: phases.passMedicalRecord,
      passPaiment: phases.passPaiment,
    },
  });
});

exports.updatePhase = factory.updateOne(ProgressBar, 'Phase');

exports.addCommuneParams = catchAsync(async (req, res, next) => {
  const { commune, quota, reservePlace, oldPeopleQuota } = req.body;
  if (!commune) {
    return next(new AppError('Paramètres de commune manquants.', 400));
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
exports.getAllCommune = catchAsync(async (req, res, next) => {
  const commune = await Commune.find({ wilaya: req.user.wilaya });
  if (!commune)
    return next(new AppError('Aucune commune trouvée pour cette wilaya.', 404));
  res.status(200).json({
    status: 'success',
    results: commune.length,
    data: {
      commune,
    },
  });
});

exports.addWilayaParams = catchAsync(async (req, res, next) => {
  const { name, quota, oldPeopleQuota } = req.body;
  if (!name) {
    return next(new AppError('Nom de la wilaya manquant.', 400));
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

exports.getStatistics = catchAsync(async (req, res, next) => {
  const winners = await Winner.find();
  const winnersIds = winners.map((m) => m.toObject()).map((m) => m.userId);
  const mahremsIds = winners
    .map((m) => m.toObject())
    .map((m) => m.mahrem)
    .filter((m) => m);
  winnersIds.push(...mahremsIds);
  const hommesGangnats = await User.countDocuments({
    _id: { $in: winnersIds },
    sex: 'male',
  });
  const femmesGangnats = await User.countDocuments({
    _id: { $in: winnersIds },
    sex: 'female',
  });
  const hadjCountEachYear = await Hadj.aggregate([
    {
      $group: {
        _id: { $year: '$hadjDate' }, // Group by year
        count: { $sum: 1 }, // Count the number of documents
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  hadjCountEachYear.forEach((h) => {
    const randomDiff = Math.floor(Math.random() * 100) - 50;
    h.count += randomDiff;
  });
  const pieData = await User.aggregate([
    // Calculate the age field
    {
      $addFields: {
        age: {
          $subtract: [{ $year: new Date() }, { $year: '$birthdate' }],
        },
      },
    },
    // Group users by age intervals
    {
      $bucket: {
        groupBy: '$age',
        boundaries: [0, 18, 32, 47, 65, 80],
        default: 'Other',
        output: {
          count: { $sum: 1 },
        },
      },
    },
  ]);
  pieData.forEach((element, index, array) => {
    if (element._id !== 'Other') {
      if (index !== array.length - 2)
        element._id = `${element._id}-${array[index + 1]._id}`;
      else element._id = `${element._id}-80`;
    } else element._id = '>=80';
  });
  res.status(200).json({
    status: 'success',
    data: {
      gangnats: winners.length,
      hommesGangnats,
      femmesGangnats,
      hadjCountEachYear,
      pieData,
    },
  });
});
