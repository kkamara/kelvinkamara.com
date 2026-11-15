'use strict';
const nodemailer = require('nodemailer');
const path = require('node:path');
const pug = require('pug');
const config = require('../config');

const getTransporter = async () => {
  if (config.mailgunSecret && config.mailgunDomain) {
    return nodemailer.createTransport({
      host: 'smtp.mailgun.org',
      port: 587,
      secure: false,
      auth: {
        user: `postmaster@${config.mailgunDomain}`,
        pass: config.mailgunSecret,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });
  }

  return nodemailer.createTransport({
    host: config.mailHost,
    port: parseInt(config.mailPort),
    secure: config.mailSecure,
    auth: config.mailUser ? {
      user: config.mailUser,
      pass: config.mailPass || '',
    } : undefined,
    connectionTimeout: 5000,
    greetingTimeout: 5000,
  });
};

const sendContactEmail = async ({ name, email, message, appUrl }) => {
  try {
    const htmlTemplate = pug.renderFile(
      path.join(__dirname, '../views/emails/contact.pug'),
      {
        name,
        email,
        message,
        appUrl,
        currentYear: new Date().getFullYear(),
      }
    );

    const transporter = await getTransporter();

    await transporter.sendMail({
      from: config.mailFrom,
      to: config.mailTo,
      subject: config.mailSubject,
      html: htmlTemplate,
      replyTo: email,
    });

    console.log(`Contact email sent from ${email}`);
  } catch (error) {
    console.error('Failed to send contact email:', error.message);
    throw error;
  }
};

module.exports = {
  sendContactEmail,
};
