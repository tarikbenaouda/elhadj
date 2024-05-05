const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../../models/userModel');
const RegistrationHistory = require('../../models/registrationHistoryModel');

dotenv.config({ path: './config.env' });
const registrations = JSON.parse(
  fs.readFileSync(`${__dirname}/registrations6.json`, {
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

const importData = async () => {
  try {
    let id;
    let mahrem;
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < 1500; i++) {
      console.log(registrations[i].nationalNumber);
      // eslint-disable-next-line no-await-in-loop
      id = await User.findOne({
        nationalNumber: String(registrations[i].nationalNumber),
      });
      // eslint-disable-next-line no-await-in-loop
      mahrem = await User.findOne({
        nationalNumber: String(registrations[i].mahrem),
      });
      delete registrations[i].nationalNumber;
      registrations[i].userId = id;
      if (mahrem) registrations[i].mahrem = mahrem;
      // eslint-disable-next-line no-await-in-loop
      await RegistrationHistory.create(registrations[i]);
      console.log(`Data successfully imported ${i} users :)`);
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
    await RegistrationHistory.deleteMany();
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
