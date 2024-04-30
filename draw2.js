const Algo = require('./models/algorithmModel');
const catchAsync = require('./utils/catchAsync');
const AppError = require('./utils/appError');
const Commune = require('./models/communeModel');
const Registration = require('./models/registrationModel');
const User = require('./models/userModel');

const duplicateUsers = (users) => {
  let duplicatedUsers = [];

  users.forEach((user) => {
    const duplicates = Math.max(1, user.coefficient); // Using coefficient from each user, defaulting to 1 if not defined
    duplicatedUsers.push(...Array(duplicates).fill(user));
  });

  return duplicatedUsers;
};

const conductDraw = (duplicatedUsers, quota) => {
  let winnerList = [];
  let reserveList = [];
  let availablePlaces = quota;

  while (availablePlaces > 0) {
    let selectedUser =
      duplicatedUsers[Math.floor(Math.random() * duplicatedUsers.length)];

    if (!winnerList.find((winner) => winner.NIN === selectedUser.NIN)) {
      if (selectedUser.mahrem && availablePlaces >= 2) {
        reserveList.push({
          NIN: selectedUser.NIN,
          mahrem: selectedUser.mahrem,
        });
        availablePlaces -= 2;
      } else {
        winnerList.push({ NIN: selectedUser.NIN });
        availablePlaces -= 1;
      }
    }

    duplicatedUsers = duplicatedUsers.filter(
      (user) => user.NIN !== selectedUser.NIN,
    );
  }
  return { winnerList, reserveList };
};

exports.executeDraw = catchAsync(async (req, res, next) => {
  const adminId = req.user._id;
  const selectedCommune = await Commune.findOne({ admin: ObjectId(adminId) });
  const registrationList = await Registration.find().toArray();

  const duplicatedUsers = await duplicateUsers(registrationList);
  const { winnerList, reserveList } = conductDraw(
    duplicatedUsers,
    Commune.quota,
  );
  res.status(201).json({
    status: 'sucess',
    winners: winnerList,
    reserve: reserveList,
  });
});
