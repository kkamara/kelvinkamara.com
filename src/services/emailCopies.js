'use strict';
const { status } = require('http-status');
const config = require('../config');
const { exposableError } = require('../utils/httpResponses');

function failureDetail(error) {
  const code = error?.response?.status;
  return Number.isInteger(code) && code >= 400 && code <= 599 ? ` (HTTP ${code})` : '';
}

async function sendWithCopy(message, send) {
  const copy = {
    ...message,
    to: config.mailCopyTo,
    subject: `Fwd: [Copy for ${message.to}] ${message.subject}`,
  };
  try {
    await send(copy);
  } catch (error) {
    throw exposableError(`The copy could not be sent${failureDetail(error)}. The recipient email was not attempted. Check delivery before retrying.`, status.BAD_GATEWAY);
  }
  try {
    await send(message);
  } catch (error) {
    throw exposableError(`The copy was accepted, but the recipient email could not be sent${failureDetail(error)}. Check delivery before retrying; another copy will be sent on retry.`, status.BAD_GATEWAY);
  }
}

async function sendSmtp(transporter, message) {
  const result = await transporter.sendMail(message);
  if (result?.rejected?.length) throw new Error('SMTP rejected a recipient.');
}

module.exports = { sendWithCopy, sendSmtp };
