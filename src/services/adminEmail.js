'use strict';
const nodemailer = require('nodemailer');
const pug = require('pug');
const path = require('node:path');
const { status } = require('http-status');
const config = require('../config');
const { exposableError } = require('../utils/httpResponses');
const { sendWithCopy, sendSmtp } = require('./emailCopies');

async function sendAdminEmail({ to, firstName, subject, message, paymentLink, attachments = [] }) {
  const html = pug.renderFile(path.join(__dirname, '../views/emails/admin.pug'), {
    appName: 'Kel Kamara', footerYear: new Date().getFullYear(),
    firstName, subject, message, paymentLink,
  });
  const text = `Hello ${firstName},\n\n${message}${paymentLink ? `\n\nPay online: ${paymentLink}` : ''}\n\nThanks,\nKel Kamara`;
  if (!config.mailFrom) throw exposableError('MAIL_FROM must be configured.', status.SERVICE_UNAVAILABLE);
  if (!config.mailHost) throw exposableError('MAIL_HOST must be configured.', status.SERVICE_UNAVAILABLE);
  if (!config.mailUser) throw exposableError('MAIL_USER must be configured.', status.SERVICE_UNAVAILABLE);

  const options = {
    host: config.mailHost,
    port: Number(config.mailPort || 587),
    secure: config.mailSecure === true,
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    auth: {
      user: config.mailUser,
      pass: config.mailPass || '',
    },
  };
  const transporter = nodemailer.createTransport(options);
  await sendWithCopy({ from: config.mailFrom, to, replyTo: config.mailReplyTo, subject, text, html, attachments }, email => sendSmtp(transporter, email));
}

module.exports = { sendAdminEmail };


