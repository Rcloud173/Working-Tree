const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message);
  }

  const response = new ApiResponse(error.statusCode, null, error.message, {
    errors: error.errors,
  });

  if (process.env.NODE_ENV === 'development') {
    logger.error(err.stack);
  }

  res.status(error.statusCode).json(response);
};

module.exports = errorHandler;
