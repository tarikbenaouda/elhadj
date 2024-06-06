//const { Model } = require('mongoose');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');

exports.deleteOne = (Model, name) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError(`No ${name} found with that ID`, 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model, name, updaterId = null) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(
      req.params.id,
      {
        ...(updaterId && { updaterId: req.user._id }),
        ...req.body,
      },
      {
        new: true,
        runValidators: true,
      },
    );
    if (!doc) {
      return next(new AppError(`No ${name} found with that ID`, 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model, name, creatorId = null) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create({
      ...(creatorId && { creatorId: req.user._id }),
      ...req.body,
    });
    if (!doc) {
      return next(new AppError(` ${name} has not been created `, 404));
    }
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.find();
    if (populateOptions) {
      query = query.populate(populateOptions);
    }
    const features = new APIFeatures(query, req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, name, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    }
    const doc = await query;
    if (!doc) {
      return next(new AppError(`No ${name} found with that ID`, 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.searchByNin = (Model, name) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findOne({
      nationalNumber: req.body.nationalNumber,
    });
    if (!doc) {
      return next(new AppError('No user found with that NIN', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });
