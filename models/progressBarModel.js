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

progressBarSchema.post(/^find/, async (docs, next) => {
  const currentDate = new Date();
  if (!Array.isArray(docs)) {
    docs = [docs];
  }
  for (const phase of docs) {
    if (currentDate < phase.startDate) {
      phase.status = 'upcoming';
    } else if (currentDate > phase.endDate) {
      phase.status = 'completed';
    } else {
      phase.status = 'current';
    }
    await phase.save({ validateBeforeSave: false });
  }
  next();
});

const ProgressBar = mongoose.model('ProgressBar', progressBarSchema);
module.exports = ProgressBar;
