const mongoose = require('mongoose');

const communeSchema = new mongoose.Schema({
  commune: String,
  wilaya: String,
  population: Number,
  reservePlace: {
    type: Number,
    default: 0,
  },
  quota: Number,
  admin: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null,
  },
});
const Commune = mongoose.model('Commune', communeSchema);
module.exports = Commune;
