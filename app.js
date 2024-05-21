const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cors = require('cors');

const userRouter = require('./routes/userRoutes');
const registrationRouter = require('./routes/registrationRoutes');
const dashboardRouter = require('./routes/dashboardRoutes');
const paymentRouter = require('./routes/paymentRoutes');
const medicalAppointmentRouter = require('./routes/MedicalAppointRoute');
const flightRouter = require('./routes/flightRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// 1) GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use(helmet());

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.use(cors());
app.set('trust proxy', 1); // trust first proxy
// Limit requests from same API
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

app.use(express.json()); // To get access to req.body (express.json() is a middleware)
app.use(express.static(`${__dirname}/public`));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS(cross-site scripting)
app.use(xss());

// Prevent parameter pollution (hpp stands for http parameters pollution)
// app.use(
//   hpp({
//     whitelist: ['duration'],
//   }),
// );

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS(cross-site scripting)
app.use(xss());

// Prevent parameter pollution (hpp stands for http parameters pollution)
// app.use(
//   hpp({
//     whitelist: ['duration'],
//   }),
// );

// Routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/dashboard', dashboardRouter);

app.use('/api/v1/registrations', registrationRouter);
app.use('/api/v1/payments', paymentRouter);
app.use('/api/v1/medicalAppointment', medicalAppointmentRouter);
app.use('/api/v1/flights', flightRouter);
// For all unhandled routes
app.all('*', (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server`, 404);
  next(err);
});

app.use((req, res, next) => {
  console.log(`Request Method: ${req.method}, Request URL: ${req.url}`);
  next();
});

//Global Error handler (The last middleware on this app)
app.use(globalErrorHandler);
module.exports = app;
