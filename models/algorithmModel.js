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
    percentageOfQuota: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    ageCoefficient: {
      type: Number,
      default: 1,
      min: 0,
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
    permit: {
      type: Boolean,
      default: true,
    },
    penaltyCoefficient: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

const Algo = mongoose.model('Algo', algoSchema);
module.exports = Algo;
