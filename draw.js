/* eslint-disable import/newline-after-import */
const Algo = require('./models/algorithmModel');
const catchAsync = require('./utils/catchAsync');
const AppError = require('./utils/appError');
const Commune = require('./models/communeModel');
const Registration = require('./models/registrationModel');
const User = require('./models/userModel');
// {
//   "_id": {
//     "$oid": "662fdb7f0dd33066621ef64e"
//   },
//   "admin": {
//     "$oid": "662f79645bdd2b2cfc75f8eb"
//   },
//   "commune": "Sidi Bel-Abbes",
//   "wilaya": "Sidi Bel Abbes",
//   "population": 605,
//   "__v": 0,
//   "quota": 60
// }

async function conductDraw(db, availablePlaces) {
  const algorithm = await Algo.findOne();

  // Step 1: Filter users based on age for quota allocation
  let olderUsers = [];
  let remainingPlaces = availablePlaces;
  let quotaPlaces;
  if (algorithm.percentageOfQuota > 0) {
    quotaPlaces = Math.round(
      availablePlaces * (algorithm.percentageOfQuota / 100),
    );
    olderUsers = await subscribeList.find({ age: { $gte: 60 } }).toArray();
    remainingPlaces -= quotaPlaces;
  }

  // Step 2: Duplicate users based on coefficient
  let duplicatedUsers = [];
  const users = await User.find().toArray();
  users.forEach((user) => {
    const duplicates = Math.max(1, user.coefficient);
    duplicatedUsers.push(...Array(duplicates).fill(user));
    //duplicatedUsers = duplicatedUsers.concat(Array(duplicates).fill(user));
  });

  // Step 3: Conduct the draw for quota users
  const olderUsersCount = olderUsers.length;
  let quotaDrawCount = Math.min(olderUsersCount, remainingPlaces);
  let quotaDuplicatedUsers = [];

  // Duplicating older users based on coefficient
  olderUsers.forEach((user) => {
    const duplicates = Math.max(1, user.coefficient);
    quotaDuplicatedUsers.push(...Array(duplicates).fill(user));
  });

  while (quotaDrawCount > 0 && remainingPlaces > 0) {
    const randomIndex = Math.floor(Math.random() * quotaDuplicatedUsers.length);
    const selectedUser = quotaDuplicatedUsers[randomIndex];

    // Remove selected user and its duplicates from quotaDuplicatedUsers
    quotaDuplicatedUsers = quotaDuplicatedUsers.filter(
      (user) => user.NIN !== selectedUser.NIN,
    );

    // Check if female user and male escort is available
    if (selectedUser.mahrem && remainingPlaces >= 2) {
      reserveList.push({ NIN: selectedUser.NIN, mahrem: selectedUser.mahrem });
      remainingPlaces -= 2;
    } else {
      winners.push({ NIN: selectedUser.NIN });
      remainingPlaces -= 1;
    }
    quotaDrawCount--;
  }

  // Step 5: Manage the last place selection scenario
  if (remainingPlaces === 1) {
    const lastWinner = duplicatedUsers.find((user) => !user.mahrem);
    if (lastWinner) {
      winners.push({ NIN: lastWinner.NIN });
      remainingPlaces--;
    }
  }
  let winners = [];
  let reserveList = [];
  let availablePlaces = Commune.quota;
  // Step 4: Conduct the draw for non-quota users
  while (availablePlaces > 0) {
    let selectedUser =
      duplicatedUsers[Math.floor(Math.random() * duplicatedUsers.length)];

    // Ensure selected user is not already a winner
    if (!winners.find((winner) => winner.NIN === selectedUser.NIN)) {
      // Check if female user and male escort is available
      if (selectedUser.mahrem && remainingPlaces >= 2) {
        reserveList.push({
          NIN: selectedUser.NIN,
          mahrem: selectedUser.mahrem,
        });
        remainingPlaces -= 2;
      } else {
        winners.push({ NIN: selectedUser.NIN });
        remainingPlaces -= 1;
      }
    }

    // Remove selected user and duplicates from pool
    duplicatedUsers = duplicatedUsers.filter(
      (user) => user.NIN !== selectedUser.NIN,
    );
  }

  // Step 5: Handle allocation of places, winners, and reserve lists
  // (Already handled within the draw process)

  // Return winners and reserve list
  return { winners, reserveList };
}

// Example usage:
// Assuming db is the MongoDB connection
// const { winners, reserveList } = await conductDraw(db, availablePlaces);
// console.log('Winners:', winners);
// console.log('Reserve List:', reserveList);
