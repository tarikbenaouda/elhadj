/* eslint-disable dot-notation */
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
  mahremMedicalRecord: {
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
  options = {},
) {
  const { commune, wilaya, id } = options;
  const matchCondition = {};
  // if (id && mongoose.Types.ObjectId.isValid(id)) {
  //   matchCondition['winnerInfo.userId'] = id;
  // }
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
      $lookup: {
        from: 'medicalrecords',
        localField: 'mahremMedicalRecord',
        foreignField: '_id',
        as: 'mahremMedicalRecordInfo',
      },
    },
    {
      $unwind: {
        path: '$mahremMedicalRecordInfo',
        preserveNullAndEmptyArrays: true, // Preserve documents where mahremMedicalRecordInfo is null or empty
      },
    },
    {
      $lookup: {
        from: 'payments',
        localField: 'payment',
        foreignField: '_id',
        as: 'payment',
      },
    },
    {
      $unwind: {
        path: '$payment',
        preserveNullAndEmptyArrays: true, // Preserve documents where payment is null or empty
      },
    },
    {
      $match: matchCondition,
    },
    {
      $addFields: {
        userId: '$winnerInfo._id',
        // firstName: '$winnerInfo.firstName',
        // lastName: '$winnerInfo.lastName',
        // email: '$winnerInfo.email',
        // birthdate: '$winnerInfo.birthdate',
        // nationalNumber: '$winnerInfo.nationalNumber',
        // commune: '$winnerInfo.commune',
        // wilaya: '$winnerInfo.wilaya',
        // //mahremId: { $ifNull: ['$mahremInfo._id', null] },
        // mahremFirstName: { $ifNull: ['$mahremInfo.firstName', null] },
        // mahremLastName: { $ifNull: ['$mahremInfo.lastName', null] },
        // mahremEmail: { $ifNull: ['$mahremInfo.email', null] },
        // mahremBirthdate: { $ifNull: ['$mahremInfo.birthdate', null] },
        // mahremNationalNumber: { $ifNull: ['$mahremInfo.nationalNumber', null] },
        // mahremCommune: { $ifNull: ['$mahremInfo.commune', null] },
        // mahremWilaya: { $ifNull: ['$mahremInfo.wilaya', null] },
        medicalRecord: {
          accepted: { $ifNull: ['$medicalRecordInfo.accepted', null] },
        },
        mahremMedicalRecord: {
          accepted: { $ifNull: ['$mahremMedicalRecordInfo.accepted', null] },
        },
        payment: {
          _id: { $ifNull: ['$payment._id', null] },
        },
      },
    },
    {
      $project: {
        // Exclude winnerInfo object
        // Exclude mahremInfo object
        medicalRecordInfo: 0,
        mahremMedicalRecordInfo: 0, // Exclude medicalRecordInfo object
        payment: 0, // Exclude payment object
        createdAt: 0, // Exclude createdAt field
        _id: 0, // Exclude _id field
        __v: 0, // Exclude __v field
        'winnerInfo.passwordChangedAt': 0,
        'winnerInfo.role': 0,
        'winnerInfo.__v': 0,
        'winnerInfo._id': 0,
        'winnerInfo.password': 0,
        'winnerInfo.address': 0,
        'winnerInfo.phone': 0,
        'winnerInfo.sex': 0,
        'mahremInfo.passwordChangedAt': 0,
        'mahremInfo.role': 0,
        'mahremInfo.__v': 0,

        'mahremInfo.password': 0,
        'mahremInfo.address': 0,
        'mahremInfo.phone': 0,
        'mahremInfo.sex': 0,
      },
    },
  ]);

  return aggregateResult;
};

winnersSchema.methods.isMahrem = function (id) {
  // Convert to string for comparison
  const idStr = String(id);

  // Check if id matches userId or mahrem
  if (String(this.userId) === idStr || String(this.mahrem) === idStr) {
    // If it matches mahrem, return true
    if (String(this.mahrem) === idStr) {
      return true;
    }
    return false;
  }
};
const Winner = mongoose.model('Winner', winnersSchema);

module.exports = Winner;
