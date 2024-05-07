/* eslint-disable no-await-in-loop */
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../../models/userModel');
const Registration = require('../../models/registrationModel');
const RegistrationHistory = require('../../models/registrationHistoryModel');
const Algo = require('../../models/algorithmModel');

dotenv.config({ path: './config.env' });
const registrations = JSON.parse(
  fs.readFileSync(`${__dirname}/registrations.json`, {
    encoding: 'utf8',
    flag: 'r',
  }),
);
console.log(registrations.length);
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  // eslint-disable-next-line no-unused-vars
  .then((con) => {
    console.log('DB connection successful');
  })
  .catch((err) => {
    console.log(err.message);
  });
const register = async (user, mahrem) => {
  const {
    defaultCoefficient,
    ageLimitToApply,
    ageCoefficient,
    registerCoefficient,
  } = await Algo.findOne({});
  const registrationsNumber = await RegistrationHistory.getRegistrationsNumber(
    user._id,
  );
  const coefficient =
    defaultCoefficient +
    registrationsNumber * registerCoefficient +
    (user.age > ageLimitToApply ? ageCoefficient : 0);

  try {
    return await Registration.create({
      userId: user._id,
      coefficient,
      mahrem,
    });
  } catch (err) {
    console.log(err.message);
  }
};
const importData = async () => {
  try {
    let user;
    let mahrem;
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < 2764; i++) {
      console.log(registrations[i].nationalNumber);

      user = await User.findOne({
        nationalNumber: String(registrations[i].nationalNumber),
      });

      mahrem =
        (await User.findOne({
          nationalNumber: String(registrations[i].mahrem),
        })) || undefined;

      await register(user, mahrem);
      console.log(`Data successfully imported ${i + 1} users :)`);
    }
    console.log('Data successfully imported :)');
  } catch (err) {
    console.log(err.message);
  } finally {
    process.exit();
  }
};

const deleteData = async () => {
  try {
    await Registration.deleteMany({});
    console.log('Data successfully deleted :)');
  } catch (err) {
    console.log(err.message);
  } finally {
    process.exit();
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
