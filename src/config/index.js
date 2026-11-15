'use strict';
const path = require('node:path');
const dotenv = require('dotenv');

const parseEnvFile = dotenv.config({
  path: path.join(__dirname, '../../.env')
});

if (parseEnvFile.error && process.env.NODE_ENV !== 'production') {
  console.warn('Warning: .env file not found, using environment variables');
}

const config = {
  asset: path => {
    if (path[0] === '/') return `${path}`;
    return `/${path}`;
  },
  appName: process.env.APP_NAME || 'KelvinKamara',
  appKey: process.env.APP_KEY,
  nodeEnv: process.env.NODE_ENV || 'development',
  appDebug: process.env.APP_DEBUG === 'true',
  appTimezone: process.env.APP_TIMEZONE || 'UTC',
  appURL: process.env.APP_URL || 'http://localhost:8000',
  appPort: process.env.PORT || 8000,
  allowedOrigins: process.env.ALLOWED_ORIGINS || 'http://localhost:8000',
  mailSecure: process.env.MAIL_SECURE === 'true',
  mailHost: process.env.MAIL_HOST || 'mailhog',
  mailPort: process.env.MAIL_PORT || 1025,
  mailUser: process.env.MAIL_USER,
  mailPass: process.env.MAIL_PASS,
  mailFrom: process.env.MAIL_FROM || '"No Reply" <noreply@kelvinkamara.com>',
  mailToAddress: process.env.MAIL_TO_ADDRESS || 'kamaracomputers@gmail.com',
  mailSubject: process.env.MAIL_SUBJECT || 'KelvinKamara.com Message Received',
  mailgunDomain: process.env.MAILGUN_DOMAIN,
  mailgunSecret: process.env.MAILGUN_SECRET,
  turnstileSitekey: process.env.TURNSTILE_SITEKEY,
  turnstileSecret: process.env.TURNSTILE_SECRET,
};

module.exports = config;
