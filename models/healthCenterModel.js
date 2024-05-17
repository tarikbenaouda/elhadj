const mongoose = require('mongoose');

const healthCenterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Health Center must have a name.'],
  },
  commune: {
    type: String,
    required: [true, 'Health Center must belong to a commune.'],
  },
  wilaya: {
    type: String,
    required: [true, 'Health Center must belong to a wilaya.'],
  },
  doctors: {
    type: [mongoose.Schema.ObjectId],
    ref: 'Doctor',
    required: [true, 'Doctor is required.'],
  },
});

const HealthCenter = mongoose.model('HealthCenter', healthCenterSchema);
exports.HealthCenter = HealthCenter;
