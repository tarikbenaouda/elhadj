const mongoose = require('mongoose');

const reserveSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A reserve must be a user!'],
    unique: true,
  },
  mahrem: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});
const Reserve = mongoose.model('Reserve', reserveSchema);

module.exports = Reserve;
