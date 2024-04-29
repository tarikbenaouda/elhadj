const Registration = require('../models/registrationModel');
const catchAsync = require('../utils/catchAsync');

exports.getAllRegistrations = catchAsync(async (req, res, next) => {
  const registrations = await Registration.find({});
  res.status(200).json({
    status: 'success',
    results: registrations.length,
    data: {
      registrations,
    },
  });
});
exports.register = catchAsync(async (req, res, next) => {
  const registration = await Registration.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      registration,
    },
  });
});
