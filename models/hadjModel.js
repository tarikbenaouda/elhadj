const mongoose = require('mongoose');

const hadjSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  mahrem: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  hadjDate: Date,
});
hadjSchema.statics.getLastHadjYear = async function (userId) {
  const mostRecentHadj = await mongoose
    .model('Hadj')
    .findOne({
      userId: userId,
    })
    .sort({ hadjDate: -1 });
  //eslint-disable-next-line unexpected-token
  return mostRecentHadj?.hadjDate.getFullYear() ?? undefined;
};

const Hadj = mongoose.model('Hadj', hadjSchema);

module.exports = Hadj;
