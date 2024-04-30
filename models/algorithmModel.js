const mongoose = require('mongoose');

const algoSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Types.ObjectId,
      ref: 'User', // Reference to the User model
    },
    defaultCoefficient: {
      type: Number,
      default: 1,
    },
    ageLimitToApply: {
      type: Number,
      default: null,
    },
    percentageOfQuota: {
      type: Number,
      default: null,
    },
    ageCoefficient: {
      type: Number,
      default: 1,
    },
    registerCoefficient: {
      type: Number,
      default: 1,
    },
    hadjLimitToApply: {
      type: Number,
      default: null,
    },
    permit: {
      type: Boolean,
      default: false,
    },
    penaltyCoefficient: {
      type: Number,
      default: 0,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

const Algo = mongoose.model('Algo', algoSchema);
module.exports = Algo;
