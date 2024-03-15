const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const communeSchema = mongoose.Schema({
  id: Number,
  commune_name_ascii: String,
  commune_name: String,
  daira_name_ascii: String,
  daira_name: String,
  wilaya_code: String,
  wilaya_name_ascii: String,
  wilaya_name: String,
});
const Commune = mongoose.model('Commune', communeSchema);
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
const communes = JSON.parse(
  fs.readFileSync(`${__dirname}/algeria_cities.json`, {
    encoding: 'utf8',
    flag: 'r',
  }),
);
const importData = async () => {
  try {
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
