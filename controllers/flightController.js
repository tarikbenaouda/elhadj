const Flight = require('../models/flightModel');
const Winner = require('../models/winnersModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllFlights = catchAsync(async (req, res, next) => {
  const flights = await Flight.find();
  res.status(200).json({
    status: 'success',
    results: flights.length,
    data: flights,
  });
});

exports.addFlight = catchAsync(async (req, res, next) => {
  const flight = await Flight.create(req.body);
  res.status(201).json({
    status: 'success',
    data: flight,
  });
});

// Booking a flight
exports.bookFlight = catchAsync(async (req, res, next) => {
  if (req.user.sex === 'female')
    return next(new AppError('Females not allowed to book a flight', 400));
  const { flightId } = req.params;
  const flight = await Flight.findById(flightId);
  if (!flight) {
    return next(new AppError('No flight found with that ID', 404));
  }
  if (!flight.allowedCities.includes(req.user.wilaya)) {
    return next(
      new AppError('You are not allowed to book a flight from this city', 400),
    );
  }
  // Check if the user is already booked on flight
  const alreadyBooked = await Flight.findOne({
    'passengers.user': req.user._id,
  });
  if (alreadyBooked) {
    if (alreadyBooked._id.toString() === flightId) {
      return next(new AppError('You are already booked on this flight', 400));
    }
    return next(
      new AppError(
        `You are already booked on flight number: ${alreadyBooked.flightNumber}`,
        400,
      ),
    );
  }

  const women = await Winner.find({ mahrem: req.user._id });
  const neededSeats = women.length + 1;
  if (flight.emptySeats < neededSeats) {
    return next(new AppError('No available seats on this flight', 400));
  }
  const passengers = [{ user: req.user._id }].concat(
    women.map((w) => ({ user: w.userId })),
  );
  flight.passengers.push(...passengers);
  await flight.save();
  const { emptySeats } = flight;
  flight.passengers = passengers;
  await flight
    .populate({
      path: 'passengers.user',
      select: 'firstName lastName nationalNumber email birthdate',
    })
    .execPopulate();
  const bookingInfo = {
    flightNumber: flight.flightNumber,
    status: flight.status,
    departure: flight.departure,
    airline: flight.airline,
    aircraft: flight.aircraft.model,
    passengers: flight.passengers,
    emptySeats,
  };

  res.status(200).json({
    status: 'success',
    data: bookingInfo,
  });
});
