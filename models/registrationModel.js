/* eslint-disable prefer-destructuring */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-constant-condition */
/* eslint-disable no-plusplus */
/* eslint-disable prefer-const */
const mongoose = require('mongoose');
const Winner = require('./winnersModel');
const Reserve = require('./reserveModel');

const registrationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A registration must belong to a user!'],
      unique: true,
    },
    coefficient: {
      type: Number,
      default: 1,
    },
    mahrem: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: () => Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

registrationSchema.statics.getExcludedWinners = async function (commune, age) {
  // Fetch winners and extract their user IDs
  const winners = await Winner.find();
  const winnerUserIds = winners.map((winner) => winner.userId.toString());
  const reserves = await Reserve.find();
  const reserveUserIds = reserves.map((reserve) => reserve.userId.toString());
  const excludedUserIds = [...winnerUserIds, ...reserveUserIds];
  const match = {
    commune: commune,
    _id: { $nin: excludedUserIds }, // Exclude winners
  };
  if (age) {
    const currentDate = new Date();
    const ageDate = new Date(
      currentDate.setFullYear(currentDate.getFullYear() - age),
    );
    match.birthdate = { $lte: ageDate }; // Only include users who are at least 'age' years old
  }
  const registrations = await this.find().populate({
    path: 'userId',
    select: 'firstName lastName commune wilaya birthdate',
    match: match, // Include birthdate to calculate age
  });

  return registrations;
};

registrationSchema.statics.getDrawPool = async function (commune, age) {
  const registrations = await this.getExcludedWinners(commune, age);

  let drawPool = [];
  registrations.forEach((registration) => {
    if (registration.userId && registration.userId.commune === commune) {
      for (let i = 0; i < registration.coefficient; i++) {
        const insertAt = Math.floor(Math.random() * (drawPool.length + 1));
        const userToInsert = {
          user: registration.userId,
          mahrem: registration.mahrem,
        };
        drawPool.splice(insertAt, 0, userToInsert);
      }
    }
  });

  return drawPool;
};

registrationSchema.statics.createObject = async function (model, drawnUser) {
  let object = await model.create({
    userId: drawnUser.user._id,
    mahrem: drawnUser.mahrem,
  });
  object = await object
    .populate({
      path: 'userId',
      select: 'firstName lastName birthdate',
    })
    .populate({
      path: 'mahrem',
      select: 'firstName lastName',
    })
    .execPopulate();
  object = object.toObject();
  delete object.__v;
  delete object._id;
  delete object.createdAt;
  delete object.userId.birthdate;
  if (object.mahrem) {
    delete object.mahrem.age;
  }
  return object;
};
registrationSchema.statics.processDrawnUser = async function (
  object,
  drawPool,
  remaining,
  availablePlace,
  count,
  commune,
  model,
) {
  try {
    while (drawPool.length > 0) {
      const randomIndex = Math.floor(Math.random() * drawPool.length);
      const drawnUser = drawPool.splice(randomIndex, 1)[0]; // remove the user from the draw pool
      const isFemale = Boolean(drawnUser.mahrem);
      if ((isFemale && remaining >= 2) || (!isFemale && remaining >= 1)) {
        object = await this.createObject(model, drawnUser);
        count += isFemale === true ? 2 : 1;
        remaining = availablePlace - count;
        return { object, remaining };
      }
      if (isFemale && remaining === 1) {
        drawPool.splice(randomIndex, 1);
        // don't return, just continue to the next iteration
      }
    }
    // if we reach here, it means the draw pool is exhausted
    return { object, remaining };
  } catch (err) {
    console.error('Error in processDrawnUser:', err);
    // Handle the error...
    throw err; // or return a default value
  }
};

registrationSchema.statics.performDraw = async function (options) {
  try {
    const { commune, quota, reservePlace, agePercentage } = options;
    let winner;
    let reserve;
    let drawPool;
    const countAll = [
      {
        $group: {
          _id: null,
          count: {
            $sum: {
              $cond: [{ $ifNull: ['$mahrem', false] }, 2, 1],
            },
          },
        },
      },
    ];

    let count = await Winner.aggregate(countAll).lean();
    count = count.length > 0 ? count[0].count : 0;
    let remainingQuota = quota !== undefined ? quota - count : 0;

    let reserveCount = await Reserve.aggregate(countAll).lean();
    reserveCount = reserveCount.length > 0 ? reserveCount[0].count : 0;
    let remainingReserve =
      reservePlace !== undefined ? reservePlace - reserveCount : 0;

    if (remainingQuota > 0) {
      drawPool = await this.getDrawPool(commune, agePercentage);
      const result = await this.processDrawnUser(
        winner,
        drawPool,
        remainingQuota,
        quota,
        count,
        commune,
        Winner,
        true,
      );
      winner = result.object;
      remainingQuota = result.remaining;
      return { winner, remainingQuota };
    }
    if (remainingReserve > 0) {
      drawPool = await this.getDrawPool(commune, agePercentage);

      const result = await this.processDrawnUser(
        reserve,
        drawPool,
        remainingReserve,
        reservePlace,
        reserveCount,
        commune,
        Reserve,
        false,
      );

      reserve = result.object;
      remainingReserve = result.remaining;
      return { reserve, remainingReserve, remainingQuota };
    }
    return { winner, remainingQuota, reserve, remainingReserve };
  } catch (err) {
    console.error('Error in performDraw:', err);
    // Handle the error...
    throw err; // or return a default value
  }
};

const Registration = mongoose.model('Registration', registrationSchema);
module.exports = Registration;
