const mongoose = require('mongoose');

const winnersSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A winner must be a user!'],
    unique: true,
  },
  mahrem: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  medicalRecord: {
    type: mongoose.Schema.ObjectId,
    ref: 'MedicalRecord',
  },
  payment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Payment',
  },
  mahremPayment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Payment',
  },
});

winnersSchema.statics.countWinnersByAge = async function (startAge, endAge) {
  const winners = await this.find().populate('userId');
  const winnersOfAge = winners.filter((winner) => {
    const age = Number(winner.userId.age);
    const start = Number(startAge);
    const end = endAge ? Number(endAge) : Infinity;
    return age >= start && age <= end;
  });
  return winnersOfAge.length;
};

winnersSchema.statics.checkUserInWinnerModel = async function (userId) {
  const user = await this.findOne({ userId: userId });
  return Boolean(user);
};

winnersSchema.statics.getWinnersByCommuneOrWilaya = async function (
  commune,
  wilaya,
) {
  const matchCondition = {};
  if (commune) {
    matchCondition['winnerInfo.commune'] = commune;
  } else if (wilaya) {
    matchCondition['winnerInfo.wilaya'] = wilaya;
  }

  const aggregateResult = await this.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'winnerInfo',
      },
    },
    {
      $unwind: '$winnerInfo',
    },
    {
      $lookup: {
        from: 'users',
        localField: 'mahrem',
        foreignField: '_id',
        as: 'mahremInfo',
      },
    },
    {
      $unwind: {
        path: '$mahremInfo',
        preserveNullAndEmptyArrays: true, // Preserve documents where mahremInfo is null or empty
      },
    },
    {
      $lookup: {
        from: 'medicalrecords',
        localField: 'medicalRecord',
        foreignField: '_id',
        as: 'medicalRecordInfo',
      },
    },
    {
      $unwind: {
        path: '$medicalRecordInfo',
        preserveNullAndEmptyArrays: true, // Preserve documents where medicalRecordInfo is null or empty
      },
    },
    {
      $match: matchCondition,
    },
    {
      $addFields: {
        userId: '$winnerInfo._id',
        firstName: '$winnerInfo.firstName',
        lastName: '$winnerInfo.lastName',
        email: '$winnerInfo.email',
        birthdate: '$winnerInfo.birthdate',
        nationalNumber: '$winnerInfo.nationalNumber',
        commune: '$winnerInfo.commune',
        wilaya: '$winnerInfo.wilaya',
        mahrem: {
          _id: { $ifNull: ['$mahremInfo._id', null] },
          firstName: { $ifNull: ['$mahremInfo.firstName', null] },
          lastName: { $ifNull: ['$mahremInfo.lastName', null] },
        },
        medicalRecord: {
          //_id: { $ifNull: ['$medicalRecordInfo._id', null] },
          accepted: { $ifNull: ['$medicalRecordInfo.accepted', null] },
        },
      },
    },
    {
      $project: {
        winnerInfo: 0, // Exclude winnerInfo object
        mahremInfo: 0, // Exclude mahremInfo object
        medicalRecordInfo: 0, // Exclude medicalRecordInfo object
        createdAt: 0, // Exclude createdAt field
        _id: 0, // Exclude _id field
        __v: 0, // Exclude __v field
      },
    },
  ]);

  return aggregateResult;
};

const Winner = mongoose.model('Winner', winnersSchema);

module.exports = Winner;
