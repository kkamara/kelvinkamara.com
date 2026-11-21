'use strict';
exports.message404 = "Resource not found.";
exports.message200 = "Success.";
exports.message400 = "Unable to process the input you have provided.";
exports.message401 = "Unauthorised.";
exports.message500 = "There was an unknown error. Please contact an administrator.";
exports.exposableError = (message, statusCode) => {
  const error = new Error(message);
  error.expose = true;
  error.statusCode = statusCode;
  return error;
};
