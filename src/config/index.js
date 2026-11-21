'use strict';
const path = require('node:path');
const dotenv = require('dotenv');

const parseEnvFile = dotenv.config({
  path: path.join(__dirname, '../../.env')
});

if (parseEnvFile.error) {
  throw parseEnvFile.error;
}

const config = {
  asset: path => {
    if (path[0] === '/') return `${path}`;
    return `/${path}`;
  },
  appName: process.env.APP_NAME,
  appKey: process.env.APP_KEY,
  nodeEnv: process.env.NODE_ENV,
  appDebug: process.env.APP_DEBUG === 'true',
  appTimezone: process.env.APP_TIMEZONE,
  appURL: process.env.APP_URL,
  appPort: process.env.PORT || process.env.port || 8000,
  allowedOrigins: process.env.ALLOWED_ORIGINS,
  mailHost: process.env.MAIL_HOST,
  mailPort: process.env.MAIL_PORT,
  mailSecure: process.env.MAIL_SECURE === 'true',
  mailgunDomain: process.env.MAILGUN_DOMAIN,
  mailUser: process.env.MAIL_USER,
  mailPass: process.env.MAIL_PASS,
  mailFrom: process.env.MAIL_FROM,
  mailReplyTo: 'kamaracomputers@gmail.com',
  mailTo: process.env.MAIL_TO,
  mailSubject: process.env.MAIL_SUBJECT,
  turnstileSitekey: process.env.TURNSTILE_SITEKEY,
  turnstileSecret: process.env.TURNSTILE_SECRET,
  adminPassword: process.env.ADMIN_PASSWORD,
  stripeSecret: process.env.STRIPE_SECRET,
};

module.exports = config;
