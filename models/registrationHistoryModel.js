const mongoose = require('mongoose');

const registrationHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Registration history must belong to a user!'],
  },
  registrationDate: Date,
  selected: Boolean,
  mahrem: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
});
registrationHistorySchema.statics.getRegistrationsNumber = async function (
  userId,
) {
  const mostRecentSelectedRegistration = await mongoose
    .model('RegistrationHistory')
    .findOne({
      userId: userId,
      selected: true,
    })
    .sort({ registrationDate: -1 }); // Sort by registrationDate in descending order to get the most recent

  if (!mostRecentSelectedRegistration) {
    return await mongoose
      .model('RegistrationHistory')
      .countDocuments({ userId: userId });
  }

  // Step 2: Find all registrations where selected = false and the registrationDate is after the most recent selected registration's registrationDate
  const count = await mongoose.model('RegistrationHistory').countDocuments({
    userId: userId,
    selected: false,
    registrationDate: { $gt: mostRecentSelectedRegistration.registrationDate },
  });
  return count;
};

const RegistrationHistory = mongoose.model(
  'RegistrationHistory',
  registrationHistorySchema,
);

module.exports = RegistrationHistory;
