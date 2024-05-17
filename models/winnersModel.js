const mongoose = require('mongoose');

const winnersSchema = new mongoose.Schema({
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
});

winnersSchema.statics.countWinnersByAge = async function (age) {
  const winners = await this.find().populate('userId');
  const winnersOfAge = winners.filter(
    (winner) => Number(winner.userId.age) >= Number(age),
  );
  return winnersOfAge.length;
};
winnersSchema.statics.checkUserInWinnerModel = async function (userId) {
  const user = await this.findOne({ userId: userId });
  return Boolean(user);
};
winnersSchema.statics.getWinnersByCommune = async function (commune) {
  const aggregateResult = await this.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'winnerInfo',
      },
    },
    {
      $unwind: '$winnerInfo',
    },
    {
      $match: {
        'winnerInfo.commune': commune,
      },
    },
    {
      $addFields: {
        userId: '$winnerInfo._id',
        mahrem: '$mahrem',
        firstName: '$winnerInfo.firstName',
        lastName: '$winnerInfo.lastName',
        nationalNumber: '$winnerInfo.nationalNumber',
      },
    },
    {
      $project: {
        winnerInfo: 0, // Exclude winnerInfo object
        createdAt: 0, // Exclude createdAt field
        mahrem: 0, // Exclude mahrem field
        _id: 0, // Exclude _id field
        __v: 0, // Exclude __v field
      },
    },
  ]);

  return aggregateResult;
};

const Winner = mongoose.model('Winner', winnersSchema);

module.exports = Winner;
