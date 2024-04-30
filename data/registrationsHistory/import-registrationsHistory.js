const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../../models/userModel');
const RegistrationHistory = require('../../models/registrationHistoryModel');

dotenv.config({ path: './config.env' });
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/registrationsHistory.json`, {
    encoding: 'utf8',
    flag: 'r',
  }),
);
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
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < 1000; i++) {
      // eslint-disable-next-line no-await-in-loop
      await User.find(users.slice(i * 20, (i + 1) * 20));
      console.log(`Data successfully imported ${(i + 1) * 20} users :)`);
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
