const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  creatorId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A medical Record must have a doctor!'],
  },
  updaterId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  patient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A medical Record must have a patient!'],
    unique: true,
  },
  description: {
    type: String,
    required: [true, 'A medical Record must have a description!'],
  },
  date: {
    type: Date,
    required: [true, 'A medical Record must have a date!'],
    default: Date.now(),
  },
  accepted: {
    type: Boolean,
    default: false,
  },
  chronicDisease: {
    type: [String],
    default: null,
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: [true, 'A medical Record must have a blood type!'],
  },
});

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);
module.exports = MedicalRecord;
