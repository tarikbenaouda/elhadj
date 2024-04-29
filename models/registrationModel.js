const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A registration must belong to a user!'],
      select: false,
    },
    coefficient: {
      type: Number,
      default: 1,
    },
    mahrem: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
registrationSchema.pre(/^find/, function () {
  this.populate({ path: 'user', select: 'firstName lastName commune' });
});
const Registration = mongoose.model('Registration', registrationSchema);
module.exports = Registration;
