/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const mongoose = require('mongoose');
const validator = require('validator');

const progressBarSchema = new mongoose.Schema(
  {
    phaseName: {
      type: String,
      required: [true, 'A progress phase must have a phase name!'],
      unique: [true, 'A progress phase must have a unique phase name!'],
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide us your startDate!'],
      trim: true,
      validate: [validator.isDate, 'Please provide a valid startDate!'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide us your endDate!'],
      trim: true,
      validate: [validator.isDate, 'Please provide a valid endDate!'],
    },
    description: {
      type: String,
      required: [true, 'A progress phase must have a description!'],
    },
    status: {
      type: String,
      enum: ['completed', 'current', 'upcoming'],
      default: 'upcoming',
    },
  },
  { timestamps: true },
);
progressBarSchema.pre('save', async function (next) {
  const currentDate = new Date();
  if (currentDate < this.startDate) {
    this.status = 'upcoming';
  } else if (currentDate > this.endDate) {
    this.status = 'completed';
  } else {
    const currentPhases = await this.model('ProgressBar').find({
      status: 'current',
    });
    if (currentPhases.length > 0) {
      this.status = 'upcoming';
    } else {
      this.status = 'current';
    }
  }
  next();
});
progressBarSchema.pre(/^update/, async function (next) {
  const update = this.getUpdate();
  if (update.startDate || update.endDate) {
    const currentDate = new Date();
    if (currentDate < update.startDate) {
      update.status = 'upcoming';
    } else if (currentDate > update.endDate) {
      update.status = 'completed';
    } else {
      const currentPhases = await this.model.find({ status: 'current' });
      if (currentPhases.length > 0) {
        update.status = 'upcoming';
      } else {
        update.status = 'current';
      }
    }
  }
  next();
});

const ProgressBar = mongoose.model('ProgressBar', progressBarSchema);
module.exports = ProgressBar;
