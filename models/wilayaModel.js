const mongoose = require('mongoose');

const wilayaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Wilaya name is required'],
    unique: true,
  },
  population: Number,
  quota: Number,
  oldPeopleQuota: {
    type: Number,
    default: 0,
  },
  admin: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
});

const Wilaya = mongoose.model('Wilaya', wilayaSchema);
module.exports = Wilaya;
