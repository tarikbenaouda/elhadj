const mongoose = require('mongoose');

const passengerRefSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      //unique: { index: true, partialFilterExpression: { user: { $ne: null } } },
    },
  },
  { _id: false },
);

const flightSchema = new mongoose.Schema(
  {
    flightNumber: { type: String, required: true, unique: true },
    airline: { type: String, default: 'Air Algeria' },
    departure: {
      airport: { type: String, required: true },
      city: { type: String, required: true },
      country: { type: String, default: 'Algeria' },
      scheduledTime: { type: Date, required: true },
    },
    aircraft: {
      model: { type: String, default: 'Boeing 777' },
      seats: { type: Number, default: 250 },
    },
    allowedCities: { type: [String], required: true },
    passengers: [passengerRefSchema],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

flightSchema.virtual('emptySeats').get(function () {
  return this.aircraft.seats - this.passengers.length;
});

flightSchema.virtual('status').get(function () {
  const scheduledTime = new Date(this.departure.scheduledTime);
  const now = new Date();
  return now < scheduledTime ? 'On-Time' : 'Departed';
});

const Flight = mongoose.model('Flight', flightSchema);
module.exports = Flight;
