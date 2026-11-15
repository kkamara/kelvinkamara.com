'use strict';
const { status } = require('http-status');
const asyncHandler = require('express-async-handler');

module.exports.notFound = asyncHandler((req, res, next) => {
  const error = new Error(`Not found: ${req.originalUrl}`);
  res.status(status.NOT_FOUND);
  next(error);
});

module.exports.jsonError = (err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'local';
  
  if (isDevelopment) {
    console.error(err);
  }

  return res.status(res.statusCode || status.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    stack: isDevelopment ? err.stack : null,
  });
};
