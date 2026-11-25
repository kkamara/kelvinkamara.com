'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');
const config = require('../src/config');
const { sendAdminEmail } = require('../src/services/adminEmail');

test('development email goes to isolated MailHog with the document attached', async t => {
  const smtpPort = process.env.ADMIN_TEST_MAILHOG_SMTP_PORT;
  const apiPort = process.env.ADMIN_TEST_MAILHOG_API_PORT;
  if (!smtpPort || !apiPort) throw new Error('Isolated MailHog SMTP and API ports are required.');
  const originalConfig = { ...config };
  t.after(() => Object.assign(config, originalConfig));
  config.nodeEnv = 'development';
  config.mailFrom = 'Kel Kamara <sender@example.test>';
  config.mailHost = '127.0.0.1';
  config.mailPort = smtpPort;
  config.mailSecure = false;
  config.mailUser = 'test-user';
  config.mailPass = 'test-password';
  await sendAdminEmail({
    to: 'client@example.test', firstName: 'Ava', subject: 'Invoice',
    message: 'Please pay by bank transfer.', paymentLink: '',
    attachments: [{ filename: 'invoice.pdf', content: Buffer.from('%PDF-test'), contentType: 'application/pdf' }],
  });
  const response = await fetch(`http://127.0.0.1:${apiPort}/api/v2/messages`);
  assert.equal(response.status, 200);
  const messages = await response.json();
  assert.equal(messages.total, 2);
  const copy = messages.items.find(item => item.Content.Headers.To[0].includes('kamaracomputers@gmail.com'));
  const recipient = messages.items.find(item => item.Content.Headers.To[0].includes('client@example.test'));
  assert.ok(copy && recipient);
  assert.equal(copy.Content.Headers.Subject[0], 'Fwd: [Copy for client@example.test] Invoice');
  for (const item of [copy, recipient]) {
    assert.match(item.Raw.Data, /invoice\.pdf/);
    assert.match(item.Raw.Data, /Please pay by bank transfer/);
    assert.equal(item.Content.Headers['Reply-To'][0], 'kamaracomputers@gmail.com');
  }
});

test('production email via SMTP with authentication and document attachment', async () => {
  const originalTransport = nodemailer.createTransport;
  const originalConfig = { ...config };
  const messages = [];
  let transportOptions;
  nodemailer.createTransport = options => {
    transportOptions = options;
    return { sendMail: async message => messages.push(message) };
  };
  try {
    config.nodeEnv = 'production';
    config.mailFrom = 'Kel Kamara <sender@example.test>';
    config.mailHost = 'smtp.example.test';
    config.mailPort = 587;
    config.mailSecure = false;
    config.mailUser = 'apiuser';
    config.mailPass = 'apikey';
    await sendAdminEmail({
      to: 'client@example.test', firstName: 'Ava', subject: 'Invoice', message: 'Hello',
      attachments: [{ filename: 'invoice.pdf', content: Buffer.from('%PDF-test'), contentType: 'application/pdf' }],
    });
    assert.deepEqual(transportOptions.auth, { user: 'apiuser', pass: 'apikey' });
    assert.equal(messages.length, 2);
    assert.equal(messages[0].to, 'kamaracomputers@gmail.com');
    assert.equal(messages[1].to, 'client@example.test');
    for (const message of messages) {
      assert.equal(message.replyTo, 'kamaracomputers@gmail.com');
      assert.match(message.text, /Hello/);
      assert.equal(message.attachments[0].filename, 'invoice.pdf');
      assert.deepEqual(message.attachments[0].content, Buffer.from('%PDF-test'));
    }
  } finally {
    nodemailer.createTransport = originalTransport;
    Object.assign(config, originalConfig);
  }
});

test('production email fails closed if MAIL_HOST is not configured', async () => {
  const originalConfig = { ...config };
  try {
    config.nodeEnv = 'production';
    config.mailFrom = 'Kel Kamara <sender@example.test>';
    config.mailHost = '';
    config.mailUser = 'apiuser';
    await assert.rejects(() => sendAdminEmail({ to: 'client@example.test', firstName: 'Ava', subject: 'Invoice', message: 'Hello' }), /MAIL_HOST must be configured/);
  } finally {
    Object.assign(config, originalConfig);
  }
});

test('production email fails closed if MAIL_USER is not configured', async () => {
  const originalConfig = { ...config };
  try {
    config.nodeEnv = 'production';
    config.mailFrom = 'Kel Kamara <sender@example.test>';
    config.mailHost = 'smtp.example.test';
    config.mailUser = '';
    await assert.rejects(() => sendAdminEmail({ to: 'client@example.test', firstName: 'Ava', subject: 'Invoice', message: 'Hello' }), /MAIL_USER must be configured/);
  } finally {
    Object.assign(config, originalConfig);
  }
});

test('SMTP failures do not expose credentials in error messages', async () => {
  const originalTransport = nodemailer.createTransport;
  const originalConfig = { ...config };
  try {
    config.nodeEnv = 'production';
    config.mailFrom = 'Kel Kamara <sender@example.test>';
    config.mailHost = 'smtp.example.test';
    config.mailUser = 'apiuser';
    config.mailPass = 'secret-api-key';
    nodemailer.createTransport = () => ({
      sendMail: async () => {
        throw new Error('SMTP failed: secret-api-key was invalid');
      },
    });
    await assert.rejects(() => sendAdminEmail({ to: 'client@example.test', firstName: 'Ava', subject: 'Invoice', message: 'Hello' }),
      error => !error.message.includes('secret-api-key'));
  } finally {
    nodemailer.createTransport = originalTransport;
    Object.assign(config, originalConfig);
  }
});


