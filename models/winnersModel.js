const mongoose = require('mongoose');

const winnersSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A winner must be a user!'],
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
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
  },
);

winnersSchema.statics.countWinnersByAge = async function (age) {
  const winners = await this.find().populate('userId');
  const winnersOfAge = winners.filter(
    (winner) => Number(winner.userId.age) >= Number(age),
  );
  return winnersOfAge.length;
};

const Winner = mongoose.model('Winner', winnersSchema);

module.exports = Winner;
