"use strict";
const config = require('../../config');
const { status } = require("http-status");

module.exports.cors = (req, res, next) => {
  const allowedOrigins = config.allowedOrigins.split(",");
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Authorization, x-id, Content-Length, X-Requested-With, Time-Zone');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(status.NO_CONTENT);
  }
  next();
};