'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const config = require('../src/config');
const { sendAdminEmail } = require('../src/services/adminEmail');

test('development email goes to isolated MailHog with the document attached', async () => {
  const smtpPort = process.env.ADMIN_TEST_MAILHOG_SMTP_PORT;
  const apiPort = process.env.ADMIN_TEST_MAILHOG_API_PORT;
  if (!smtpPort || !apiPort) throw new Error('Isolated MailHog SMTP and API ports are required.');
  config.nodeEnv = 'development';
  config.mailFrom = 'Kel Kamara <sender@example.test>';
  process.env.MAILHOG_HOST = '127.0.0.1';
  process.env.MAILHOG_PORT = smtpPort;
  await sendAdminEmail({
    to: 'client@example.test', firstName: 'Ava', subject: 'Invoice',
    message: 'Please pay by bank transfer.', paymentLink: '',
    attachments: [{ filename: 'invoice.pdf', content: Buffer.from('%PDF-test'), contentType: 'application/pdf' }],
  });
  const response = await fetch(`http://127.0.0.1:${apiPort}/api/v2/messages`);
  assert.equal(response.status, 200);
  const messages = await response.json();
  assert.equal(messages.total, 1);
  assert.match(messages.items[0].Raw.Data, /invoice\.pdf/);
  assert.match(messages.items[0].Raw.Data, /Please pay by bank transfer/);
});

test('production uses Mailgun and fails closed if credentials are missing', async () => {
  config.nodeEnv = 'production';
  config.mailFrom = 'Kel Kamara <sender@example.test>';
  config.mailgunDomain = 'example.test';
  config.mailPass = 'test-key';
  const originalPost = axios.post;
  let call;
  axios.post = async (...args) => { call = args; return { status: 200 }; };
  try {
    await sendAdminEmail({
      to: 'client@example.test', firstName: 'Ava', subject: 'Invoice', message: 'Hello',
      attachments: [{ filename: 'invoice.pdf', content: Buffer.from('%PDF-test'), contentType: 'application/pdf' }],
    });
    assert.equal(call[0], 'https://api.eu.mailgun.net/v3/example.test/messages');
    assert.equal(call[1].get('to'), 'client@example.test');
    assert.equal(call[1].get('attachment').name, 'invoice.pdf');
    assert.equal(call[2].auth.password, 'test-key');
    axios.post = async () => {
      const error = new Error('test-key and private message');
      error.response = { status: 401 };
      throw error;
    };
    await assert.rejects(() => sendAdminEmail({ to: 'client@example.test', firstName: 'Ava', subject: 'Invoice', message: 'Hello' }),
      error => error.message === 'Mailgun could not send the email (HTTP 401). Check delivery before retrying.');
    config.mailPass = '';
    await assert.rejects(() => sendAdminEmail({ to: 'client@example.test', firstName: 'Ava', subject: 'Invoice', message: 'Hello' }), /Mailgun/);
  } finally {
    axios.post = originalPost;
  }
});
