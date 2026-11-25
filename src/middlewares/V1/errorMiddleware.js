"use strict";
const { nodeEnv } = require('../../config');
const { status, } = require('http-status');
const { message500 } = require('../../utils/httpResponses');
const asyncHandler = require("express-async-handler");

module.exports.notFound = asyncHandler((req, res, next) => {
  const error = new Error(`Not found: ${req.originalUrl}`);
  res.status(status.NOT_FOUND);
  next(error);
});

module.exports.jsonError = (err, req, res, next) => {
  console.error('Request failed:', {
    name: err.name,
    message: err.message,
    code: err.code,
    statusCode: res.statusCode,
    method: req.method,
    path: req.path,
    stack: err.stack,
  });
  // Handlers set the status before throwing; anything else is an unexpected failure (or a body-parser error).
  const handled = 400 <= res.statusCode;
  const statusCode = handled ?
    res.statusCode :
    (400 <= err.status && 600 > err.status ? err.status : status.INTERNAL_SERVER_ERROR);
  const exposeMessage = handled || 500 > statusCode || "production" !== nodeEnv;
  return res.status(statusCode)
    .send({
      message: exposeMessage ? err.message : message500,
      stack: "production" === nodeEnv ? null : err.stack,
    });
};