const express = require('express');
const morgan = require('morgan');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
app.use(express.json()); // To get access to req.body (express.json() is a middleware)
app.use(express.static(`${__dirname}/public`));

app.use('/api/v1/users', userRouter);
// For all unhandled routes
app.all('*', (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server`, 404);
  next(err);
});

//Global Error handler (The last middleware on this app)
app.use(globalErrorHandler);
module.exports = app;
