const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  postman: {
    type: mongoose.Schema.ObjectId,
    required: [true, 'Payment type is required.'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required.'],
  },
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    unique: [true, 'User already has a payment.'],
    required: [true, 'Payment must belong to a user.'],
  },
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
    required: [true, 'Payment must belong to a commune.'],
  },
  refunded: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: () => Date.now(),
  },
});

paymentSchema.statics.getPaymentsByCommune = async function (commune) {
  const aggregateResult = await this.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'payerInfo',
      },
    },
    {
      $unwind: '$payerInfo',
    },
    {
      $match: {
        'payerInfo.commune': commune,
      },
    },
    {
      $project: {
        payerInfo: 0, // Exclude payerInfo object
        createdAt: 0, // Exclude createdAt field
        _id: 0, // Exclude _id field
        __v: 0, // Exclude __v field
      },
    },
    {
      $lookup: {
        from: 'posts',
        localField: 'post',
        foreignField: '_id',
        as: 'postInfo',
      },
    },
    {
      $unwind: '$postInfo',
    },
    {
      $project: {
        'postInfo.postman': 0, // Exclude createdAt field
        'postInfo._id': 0, // Exclude _id field
        'postInfo.__v': 0, // Exclude __v field
      },
    },
  ]);

  return aggregateResult;
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
