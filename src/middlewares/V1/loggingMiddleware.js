'use strict';
const morgan = require('morgan');
const fs = require('fs');
const path = require('node:path');

const logDir = path.join(__dirname, '../../..', 'logs');

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const accessLogStream = fs.createWriteStream(
  path.join(logDir, 'access.log'),
  { flags: 'a' }
);

const requestLogFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

module.exports.requestLog = morgan(requestLogFormat, {
  stream: accessLogStream,
});

module.exports.consoleLog = morgan(requestLogFormat);
