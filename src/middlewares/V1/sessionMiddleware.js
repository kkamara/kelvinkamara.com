'use strict';
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const path = require('node:path');
const config = require('../../config');

const sessionConfig = {
  store: new FileStore({
    path: path.join(__dirname, '../../..', 'sessions'),
  }),
  secret: config.appKey || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.nodeEnv === "production",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};

module.exports.session = session(sessionConfig);
