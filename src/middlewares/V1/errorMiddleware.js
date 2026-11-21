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
  const errorStatus = err.statusCode || err.status;
  const statusCode = res.statusCode >= 400 ? res.statusCode :
    (Number.isInteger(errorStatus) && errorStatus >= 400 && errorStatus <= 599 ? errorStatus : status.INTERNAL_SERVER_ERROR);
  if (nodeEnv !== "production") {
    console.log(err);
  } else if (statusCode >= 500) {
    console.error('Request failed:', err.name, err.code || '');
  }
  return res.status(statusCode)
    .send({
      message: nodeEnv === "production" && statusCode >= 500 && err.expose !== true ? message500 : err.message,
      stack: "production" === nodeEnv ? null : err.stack,
    });
};