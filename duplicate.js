const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // your user schema properties here
  coefficient: { type: Number, required: true },
});

const UserModel = mongoose.model('User', userSchema);

// Example usage
const duplicateUsers = async () => {
  const pipeline = [
    {
      $project: {
        _id: 0, // exclude the original document _id
        user: '$$ROOT', // create a new field "user" with the original document
        duplicates: { $multiply: ['$coefficient', 1] }, // calculate duplicates based on coefficient
      },
    },
    {
      $unwind: '$user', // unwind the "user" array for duplication
    },
    {
      $addFields: {
        copyNumber: { $literal: mongoose.Types.ObjectId() }, // generate a random _id for each duplicate
      },
    },
    {
      $lookup: {
        from: 'User', // reference the User collection again
        localField: 'user._id', // join on the original user's _id
        foreignField: '_id',
        as: 'originalUser',
      },
    },
    {
      $unwind: '$originalUser', // unwind the "originalUser" array to merge data
    },
    {
      $project: {
        _id: '$copyNumber', // use the generated _id for the duplicated document
        // include other desired fields from user and originalUser
      },
    },
    {
      $group: {
        _id: null, // group all documents (optional, can be removed if order doesn't matter)
        results: { $push: '$$ROOT' }, // push duplicated documents into an array
      },
    },
    {
      $unwind: '$results', // unwind the "results" array for final output
    },
    {
      $limit: { $sum: ['$user.coefficient', originalUserCount] }, // limit based on total duplicates
    },
  ];

  const duplicatedData = await UserModel.aggregate(pipeline);
  return duplicatedData;
};

// Get the original user count (assuming users are already fetched)
const originalUserCount = await UserModel.countDocuments({});

// Call the function to duplicate users
const duplicatedUsersData = await duplicateUsers();
console.log(duplicatedUsersData);
