class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    console.log(`message : ${message} \nstatusCode : ${statusCode}`);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
