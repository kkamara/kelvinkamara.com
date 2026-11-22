'use strict';
const axios = require('axios');
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
  if (config.nodeEnv === 'production') {
    if (!config.mailgunDomain || !config.mailPass || !/^[a-z0-9.-]+$/i.test(config.mailgunDomain)) {
      throw exposableError('Mailgun domain and API key must be configured.', status.SERVICE_UNAVAILABLE);
    }
    await sendWithCopy({ from: config.mailFrom, to, subject, text, html, attachments }, async email => {
      const data = new FormData();
      for (const [key, value] of Object.entries({ from: email.from, to: email.to, subject: email.subject, text: email.text, html: email.html })) data.append(key, value);
      data.append('h:Reply-To', config.mailReplyTo);
      for (const attachment of email.attachments) {
        data.append('attachment', new Blob([attachment.content], { type: attachment.contentType }), attachment.filename);
      }
      await axios.post(`https://api.eu.mailgun.net/v3/${config.mailgunDomain}/messages`, data, {
        auth: { username: 'api', password: config.mailPass },
        timeout: 15000,
      });
    });
  } else if (config.nodeEnv === 'development') {
    const transporter = nodemailer.createTransport({
      host: process.env.MAILHOG_HOST || 'mailhog', port: Number(process.env.MAILHOG_PORT || 1025), secure: false,
      connectionTimeout: 5000, greetingTimeout: 5000,
    });
    await sendWithCopy({ from: config.mailFrom, to, replyTo: config.mailReplyTo, subject, text, html, attachments }, email => sendSmtp(transporter, email));
  } else {
    throw exposableError('Admin email delivery is not configured for this environment.', status.SERVICE_UNAVAILABLE);
  }
}

module.exports = { sendAdminEmail };
