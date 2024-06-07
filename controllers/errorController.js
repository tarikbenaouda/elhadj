const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalide ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};
const handleDuplicateFieldsDB = (err) => {
  const value = Object.entries(err.keyValue).at(0).at(1);
  const message = `Valeur de champ en double : '${value}'. Veuillez en utiliser une autre.`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Données d'entrée invalides. ${errors.join('. ')}.`;
  return new AppError(message, 400);
};
const handleJWTError = () =>
  new AppError('Erreur invalide. Veuillez vous reconnecter !', 401);
const handleTokenExpiredError = () =>
  new AppError('Votre jeton a expiré ! Veuillez vous reconnecter.', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    // Operational, trusted error: send message to client
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.log('ERROR: ', err);

    res.status(500).json({
      status: 'error',
      message: "Quelque chose s'est très mal passé !",
    });
  }
};
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error;
    // CastError Handler (Caused by mongoose)
    if (err.name === 'CastError') error = handleCastErrorDB(err);
    // Duplicate Fields Error (Caused by the undelying mongodb)
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    // Handling ValidatorError
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    // Handling JWT Error
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleTokenExpiredError();
    error = error || err;
    sendErrorProd(error, res);
  }
};
