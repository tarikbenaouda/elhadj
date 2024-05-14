const mongoose = require('mongoose');

const algoSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Types.ObjectId,
      ref: 'User', // Reference to the User model
      require: [true, 'An algorithm must be created by a user!'],
    },
    updaterId: {
      type: mongoose.Types.ObjectId,
      ref: 'User', // Reference to the User model
    },
    defaultCoefficient: {
      type: Number,
      default: 1,
      min: 1,
    },
    ageLimitToApply: {
      type: Number,
      default: null,
      min: 1,
    },
    oldQuotaAge: {
      type: Number,
      default: null,
    },

    ageCoefficient: {
      type: Number,
      default: 1,
      min: 1,
    },
    registerCoefficient: {
      type: Number,
      default: 1,
      min: 1,
    },
    hadjLimitToApply: {
      type: Number,
      default: 0,
      min: 0,
    },
    ageCategories: [
      {
        startAge: Number,
        endAge: Number,
        percentageOfQuota: Number,
      },
    ],
  },
  { timestamps: true },
);

const Algo = mongoose.model('Algo', algoSchema);
module.exports = Algo;
