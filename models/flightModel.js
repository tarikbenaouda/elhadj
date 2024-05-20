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
passengerRefSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { user: { $ne: null } } },
);

const flightSchema = new mongoose.Schema({
  flightNumber: { type: String, required: true, unique: true },
  airline: { type: String, default: 'Air Algeria' },
  departure: {
    airport: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, default: 'Algeria' },
    scheduledTime: { type: Date, required: true },
  },
  status: { type: String, default: 'open' },
  aircraft: {
    model: { type: String, default: 'Boeing 777' },
    seats: { type: Number, default: 250 },
  },
  allowedCities: { type: [String], required: true },
  passengers: [passengerRefSchema],
});

flightSchema.virtual('emptySeats').get(function () {
  return this.aircraft.seats - this.passengers.length;
});

// Ensure virtual fields are included when converting to JSON or Object
flightSchema.set('toObject', { virtuals: true });
flightSchema.set('toJSON', { virtuals: true });

const Flight = mongoose.model('Flight', flightSchema);
module.exports = Flight;
