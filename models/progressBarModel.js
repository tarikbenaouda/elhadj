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
  },
  { timestamps: true },
);

const ProgressBar = mongoose.model('ProgressBar', progressBarSchema);
module.exports = ProgressBar;
