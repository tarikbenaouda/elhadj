const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Commune = require('../../models/communeModel');
const User = require('../../models/userModel');

dotenv.config({ path: './config.env' });
const communes = JSON.parse(
  fs.readFileSync(`${__dirname}/algeria_cities.json`, {
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
  });

const importData = async () => {
  try {
    const admins = await User.find({ role: 'admin' }).lean();
    communes.forEach((commune) => {
      const admin = admins.find((a) => a.commune === commune.commune);
      commune.admin = admin._id;
      commune.quota = Math.floor(+commune.population / 10);
      commune.reserve = Math.floor(+commune.population / 100) + 1;
    });
    await Commune.create(communes);
    console.log('Data successfully imported :)');
  } catch (err) {
    console.log(err.message);
  } finally {
    process.exit();
  }
};

const deleteData = async () => {
  try {
    await Commune.deleteMany();
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
