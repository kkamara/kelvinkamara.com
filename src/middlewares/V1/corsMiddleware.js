'use strict';
const cors = require('cors');
const config = require('../../config');

const allowedOrigins = config.allowedOrigins
  ? config.allowedOrigins.split(',').map(origin => origin.trim())
  : ['http://localhost:8000'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports.cors = cors(corsOptions);
