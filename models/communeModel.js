const mongoose = require('mongoose');

const communeSchema = new mongoose.Schema({
  commune: String,
  wilaya: String,
  population: Number,
  quota: {
    type: Number,
    default: Math.floor(this.population / 10),
  },
  reservePlace: {
    type: Number,
    default: 0,
  },
  admin: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null,
  },
});
const Commune = mongoose.model('Commune', communeSchema);
module.exports = Commune;
