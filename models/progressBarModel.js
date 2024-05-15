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
  const currentDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
  );

  const startDate = new Date(this.startDate);
  const startDay = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
  );

  const endDate = new Date(this.endDate);
  const endDay = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate(),
  );

  if (startDay.getTime() > currentDay.getTime()) {
    this.status = 'upcoming';
  } else if (endDay.getTime() < currentDay.getTime()) {
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
progressBarSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  if (update.startDate || update.endDate) {
    const currentDate = new Date();
    const currentDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
    );

    const startDate = new Date(update.startDate);
    const startDay = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
    );

    const endDate = new Date(update.endDate);
    const endDay = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
    );

    if (startDay.getTime() > currentDay.getTime()) {
      this._update.status = 'upcoming';
    } else if (endDay.getTime() < currentDay.getTime()) {
      this._update.status = 'completed';
    } else {
      const currentPhases = await this.model.find({
        _id: { $ne: this.getQuery()._id },
        status: 'current',
      });
      if (currentPhases.length > 0) {
        this._update.status = 'upcoming';
      } else {
        this._update.status = 'current';
      }
    }
  }
  next();
});

const ProgressBar = mongoose.model('ProgressBar', progressBarSchema);
module.exports = ProgressBar;
