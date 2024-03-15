const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const wialyaSchema = mongoose.Schema({
  id: String,
  code: String,
  name: String,
  ar_name: String,
});
const Wilaya = mongoose.model('Wilaya', wialyaSchema);
dotenv.config({ path: './config.env' });
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
const wilayas = JSON.parse(
  fs.readFileSync(`${__dirname}/wilayas.json`, {
    encoding: 'utf8',
    flag: 'r',
  }),
);
const importData = async () => {
  try {
    await Wilaya.create(wilayas);
    console.log('Data successfully imported :)');
  } catch (err) {
    console.log(err.message);
  } finally {
    process.exit();
  }
};

const deleteData = async () => {
  try {
    await Wilaya.deleteMany();
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
