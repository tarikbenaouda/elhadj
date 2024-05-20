const mongoose = require('mongoose');

const healthCentersSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A health center must have a name!'],
    unique: true,
  },
  commune: {
    type: String,
    required: [true, 'A health center must have a commune!'],
  },
  wilaya: {
    type: String,
    required: [true, 'A health center must have a wilaya!'],
  },
  location: {
    type: String,
    required: [true, 'A health center must have a location!'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  doctors: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  ],
});

const HealthCenter = mongoose.model('HealthCenter', healthCentersSchema);

module.exports = HealthCenter;
