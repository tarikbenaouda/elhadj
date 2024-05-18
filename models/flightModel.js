const mongoose = require('mongoose');

const PassengerRefSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

const FlightSchema = new mongoose.Schema({
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
  passengers: [PassengerRefSchema],
});

FlightSchema.virtual('emptySeats').get(function () {
  return this.aircraft.seats - this.passengers.length;
});

// Ensure virtual fields are included when converting to JSON or Object
FlightSchema.set('toObject', { virtuals: true });
FlightSchema.set('toJSON', { virtuals: true });

FlightSchema.index(
  { 'passengers.user': 1, 'passengers.seat': 1 },
  { unique: true },
);

const Flight = mongoose.model('Flight', FlightSchema);

module.exports = Flight;
