/* eslint-disable prefer-const */
const mongoose = require('mongoose');
const Algorithm = require('./algorithmModel');

const communeSchema = new mongoose.Schema({
  commune: String,
  wilaya: String,
  population: Number,
  reservePlace: {
    type: Number,
    default: 0,
  },
  quota: Number,
  oldPeopleQuota: Number,
  admin: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null,
  },
});

communeSchema.method('calculatePlacesForEachCategory', async function () {
  const { ageCategories } = await Algorithm.findOne();
  if (!ageCategories) {
    console.log('percentageOfQuota or ageCategories is undefined');
    return; // Skip the rest of the function if percentageOfQuota or ageCategories is undefined
  }
  let totalAssignedQuota = 0;
  let placesForEachCategory = [];
  for (let i = 0; i < ageCategories.length; i += 1) {
    let places;
    // If it's the last iteration, assign the rest of the quota
    if (i === ageCategories.length - 1) {
      places = this.quota - totalAssignedQuota;
    } else {
      places = Math.floor(
        this.quota * (ageCategories[i].percentageOfQuota / 100),
      );
      totalAssignedQuota += places;
    }

    placesForEachCategory.push(places);
  }
  this.placesForEachCategory = placesForEachCategory;
  this.ageCategories = ageCategories;
});

const Commune = mongoose.model('Commune', communeSchema);
module.exports = Commune;
