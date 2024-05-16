/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../../models/userModel');
const Post = require('../../models/postModel');

dotenv.config({ path: './config.env' });
const posts = JSON.parse(
  fs.readFileSync(`${__dirname}/algeria_postcodes.json`, {
    encoding: 'utf8',
    flag: 'r',
  }),
);
const nationalNumbers = posts
  .map((post) => post.postman)
  .flat()
  .map((el) => String(el));

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
    const postman = await User.find({
      nationalNumber: { $in: nationalNumbers },
    });
    await Promise.all(
      postman.map(async (el) => {
        el.role = 'postman';
        await el.save({ validateBeforeSave: false });
      }),
    );

    // for (let i = 0; i < posts.length; i++) {
    //   console.log(posts[i].postman);
    //   const postmanId = postman
    //     .filter((user) => posts[i].postman.includes(+user.nationalNumber))
    //     .map((el) => el._id);
    //   console.log(postmanId);
    //   await Post.create({
    //     title: posts[i].title,
    //     postalCode: posts[i].post_code,
    //     commune: posts[i].commune,
    //     wilaya: posts[i].wilaya,
    //     postman: postmanId,
    //   });
    // }
    console.log('Data successfully imported :)');
  } catch (err) {
    console.log(err.message);
  } finally {
    process.exit();
  }
};

const deleteData = async () => {
  try {
    await Post.deleteMany({});
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
