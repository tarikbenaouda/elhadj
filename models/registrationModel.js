/* eslint-disable prefer-destructuring */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-constant-condition */
/* eslint-disable no-plusplus */
/* eslint-disable prefer-const */
const mongoose = require('mongoose');
const Winner = require('./winnersModel');
const Reserve = require('./reserveModel');

const registrationSchema = new mongoose.Schema({
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
});

registrationSchema.index({ userId: 1 }, { unique: true });

registrationSchema.statics.getDrawPool = async function (
  commune,
  startAge,
  endAge,
) {
  try {
    // Aggregation pipeline to construct the draw pool
    const pipeline = [
      {
        $lookup: {
          from: 'winners',
          localField: 'userId',
          foreignField: 'userId',
          as: 'winner',
        },
      },
      {
        $lookup: {
          from: 'reserves',
          localField: 'userId',
          foreignField: 'userId',
          as: 'reserve',
        },
      },
      {
        $match: {
          coefficient: { $gt: 0 }, // Filter by positive coefficient
          winner: { $eq: [] }, // Exclude registrations that are winners
          reserve: { $eq: [] }, // Exclude registrations that are reserves
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $match: {
          'user.commune': commune, // Match commune from the User model
        },
      },
      {
        $addFields: {
          age: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), '$user.birthdate'] },
                31536000000,
              ],
            },
          },
          repeatCount: '$coefficient', // Add a field for repeat count based on coefficient
        },
      },
      {
        $project: {
          userId: {
            _id: '$user._id',
            firstName: '$user.firstName',
            lastName: '$user.lastName',
            commune: '$user.commune',
            wilaya: '$user.wilaya',
            birthdate: '$user.birthdate',
            age: '$age', // Include age in userId
          },
          mahrem: '$mahrem',
          repeatCount: 1, // Include repeat count field
        },
      },
      {
        $group: {
          _id: '$_id',
          userId: { $first: '$userId' },
          mahrem: { $first: '$mahrem' },
          repeatCount: { $sum: '$repeatCount' },
        },
      },
      {
        $project: {
          userId: 1,
          mahrem: 1,
          drawCount: { $range: [0, '$repeatCount'] },
        },
      },
      {
        $unwind: '$drawCount',
      },
      {
        $project: {
          userId: 1,
          mahrem: 1,
        },
      },
      {
        $addFields: {
          randomField: { $rand: {} }, // Add a random field
        },
      },
      {
        $sort: {
          randomField: 1, // Sort by the random field
        },
      },
      {
        $project: {
          randomField: 0, // Exclude randomField
        },
      },
    ];

    // Age filter based on startAge and endAge
    if (startAge !== undefined || endAge !== undefined) {
      const ageFilter = {};
      if (startAge !== undefined) {
        ageFilter.$gte = startAge;
      }
      if (endAge !== undefined) {
        ageFilter.$lte = endAge;
      }
      pipeline.push({
        $match: {
          'userId.age': ageFilter, // Match age from the User model
        },
      });
    }
    // Execute aggregation pipeline
    const drawPool = await this.aggregate(pipeline);

    return drawPool;
  } catch (error) {
    console.error('Error in getDrawPool:', error);
    throw error;
  }
};

registrationSchema.statics.createObject = async function (model, drawnUser) {
  const createdObject = await model.create({
    userId: drawnUser.userId._id,
    mahrem: drawnUser.mahrem,
  });
  let object = await model
    .findOne({ _id: createdObject._id })
    .select('-_id -__v -createdAt')
    .populate({
      path: 'userId',
      select: 'firstName lastName birthdate commune wilaya',
    });
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
      const drawnUser = drawPool[randomIndex]; // remove the user from the draw pool
      const isFemale = Boolean(drawnUser.mahrem);
      if ((isFemale && remaining >= 2) || (!isFemale && remaining >= 1)) {
        object = await this.createObject(model, drawnUser);
        count += isFemale === true ? 2 : 1;
        remaining = availablePlace - count;
        return { object, remaining };
      }
      if (isFemale && remaining === 1) {
        const userExists = await Winner.checkUserInWinnerModel(
          drawnUser.mahrem,
        );
        if (userExists) {
          object = await this.createObject(model, drawnUser);
          count += 1;
          remaining = availablePlace - count;
          return { object, remaining };
        }
        drawPool.splice(randomIndex, 1);
        console.log(
          'picked a Female with a remaining place of 1 but she is not in the Winner Model',
        );
      }
    }
    // if we reach here, it means the draw pool is exhausted
    return { object, remaining };
  } catch (err) {
    console.error('Error in processDrawnUser:', err);
    throw err;
  }
};

function getCountAll(startAge, endAge) {
  let pipeline = [
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
    {
      $addFields: {
        age: {
          $floor: {
            $divide: [
              { $subtract: [new Date(), '$user.birthdate'] },
              31557600000,
            ],
          },
        },
      },
    },
  ];

  let ageCondition = {};
  if (typeof startAge !== 'undefined') {
    ageCondition.$gte = startAge;
  }
  if (typeof endAge !== 'undefined') {
    ageCondition.$lte = endAge;
  }

  if (Object.keys(ageCondition).length > 0) {
    pipeline.push({
      $match: {
        age: ageCondition,
      },
    });
  }

  pipeline.push({
    $group: {
      _id: null,
      count: {
        $sum: {
          $cond: [{ $ifNull: ['$mahrem', false] }, 2, 1],
        },
      },
    },
  });

  return pipeline;
}

registrationSchema.statics.performDraw = async function (options) {
  try {
    const {
      commune,
      quota,
      reservePlace,
      oldQuotaAge,
      placesForEachCategory,
      ageCategories,
      page,
      limit,
    } = options;
    let winner;
    let reserve;
    let drawPool;
    let remainingQuota;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    if (!placesForEachCategory && !ageCategories) {
      let count = await Winner.aggregate(getCountAll());
      count = count.length > 0 ? count[0].count : 0;
      remainingQuota = quota !== undefined ? Math.max(0, quota - count) : 0;

      if (remainingQuota > 0) {
        drawPool = await this.getDrawPool(commune, oldQuotaAge);
        const result = await this.processDrawnUser(
          winner,
          drawPool,
          remainingQuota,
          quota,
          count,
          commune,
          Winner,
        );
        winner = result.object;
        drawPool.unshift(winner);
        drawPool = drawPool.slice(startIndex, endIndex);
        remainingQuota = result.remaining;
        return { winner, remainingQuota, drawPool };
      }
    } else {
      for (let i = 0; i < ageCategories.length; i++) {
        const pipeline = getCountAll(
          ageCategories[i].startAge,
          ageCategories[i].endAge,
        );
        let count = await Winner.aggregate(pipeline);
        count = count.length > 0 ? count[0].count : 0;
        remainingQuota =
          placesForEachCategory !== undefined
            ? Math.max(0, placesForEachCategory[i] - count)
            : 0;

        if (remainingQuota > 0) {
          drawPool = await this.getDrawPool(
            commune,
            ageCategories[i].startAge,
            ageCategories[i].endAge,
          );
          const result = await this.processDrawnUser(
            winner,
            drawPool,
            remainingQuota,
            placesForEachCategory[i],
            count,
            commune,
            Winner,
          );
          winner = result.object;
          drawPool.unshift(winner);
          drawPool = drawPool.slice(startIndex, endIndex);
          remainingQuota = result.remaining;
          return { winner, remainingQuota, drawPool };
        }
      }
    }
    let reserveCount = await Reserve.aggregate(getCountAll());
    reserveCount = reserveCount.length > 0 ? reserveCount[0].count : 0;
    let remainingReserve =
      reservePlace !== undefined ? Math.max(0, reservePlace - reserveCount) : 0;
    if (remainingReserve > 0) {
      // (commune, oldQuotaAge, remainingReserve, reservePlace, reserveCount, Reserve)
      drawPool = await this.getDrawPool(commune);
      const result = await this.processDrawnUser(
        reserve,
        drawPool,
        remainingReserve,
        reservePlace,
        reserveCount,
        commune,
        Reserve,
      );
      reserve = result.object;
      drawPool.unshift(reserve);
      drawPool = drawPool.slice(startIndex, endIndex);
      remainingReserve = result.remaining;
      return { reserve, remainingReserve, drawPool };
    }
    return { winner, reserve, remainingQuota, remainingReserve, drawPool };
  } catch (err) {
    console.error('Error in performDraw:', err);
    throw err;
  }
};

const Registration = mongoose.model('Registration', registrationSchema);
module.exports = Registration;
