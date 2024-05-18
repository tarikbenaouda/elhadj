const mongoose = require('mongoose');

const PassengerRefSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  seat: { type: Number, required: true },
});

const FlightSchema = new mongoose.Schema({
  flightNumber: { type: String, required: true },
  airline: { type: String, required: true },
  departure: {
    airport: { type: String, required: true },
    wilaya: { type: String, required: true },
    scheduledTime: { type: Date, required: true },
  },
  arrival: {
    airport: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    scheduledTime: { type: Date, required: true },
  },
  duration: { type: Number, required: true },
  status: { type: String, required: true },
  aircraft: {
    model: { type: String, required: true },
    seats: { type: Number, required: true },
  },
  passengers: [PassengerRefSchema],
});

FlightSchema.virtual('emptySeats').get(function () {
  return this.totalSeats - this.passengers.length;
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
