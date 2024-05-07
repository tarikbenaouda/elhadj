const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../../models/userModel');
const Hadj = require('../../models/hadjModel');

dotenv.config({ path: './config.env' });
const hadj = JSON.parse(
  fs.readFileSync(`${__dirname}/hadj6.json`, {
    encoding: 'utf8',
    flag: 'r',
  }),
);
console.log(hadj.length);
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
    let hadjDate;
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < hadj.length; i++) {
      console.log(hadj[i].nationalNumber);
      // eslint-disable-next-line no-await-in-loop
      id = await User.findOne({
        nationalNumber: String(hadj[i].nationalNumber),
      });
      // eslint-disable-next-line no-await-in-loop
      mahrem = await User.findOne({
        nationalNumber: String(hadj[i].mahrem),
      });
      delete hadj[i].nationalNumber;
      hadj[i].userId = id;
      hadjDate = new Date(
        new Date(hadj[i].registrationDate).getTime() + 15 * 24 * 60 * 60 * 1000,
      );
      hadj[i].hadjDate = hadjDate;
      if (mahrem) hadj[i].mahrem = mahrem;
      // eslint-disable-next-line no-await-in-loop
      await Hadj.create(hadj[i]);
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
