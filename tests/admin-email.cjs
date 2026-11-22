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

test('production uses Mailgun and fails closed if credentials are missing', async () => {
  config.nodeEnv = 'production';
  config.mailFrom = 'Kel Kamara <sender@example.test>';
  config.mailgunDomain = 'example.test';
  config.mailPass = 'test-key';
  const originalPost = axios.post;
  const calls = [];
  axios.post = async (...args) => { calls.push(args); return { status: 200 }; };
  try {
    await sendAdminEmail({
      to: 'client@example.test', firstName: 'Ava', subject: 'Invoice', message: 'Hello',
      attachments: [{ filename: 'invoice.pdf', content: Buffer.from('%PDF-test'), contentType: 'application/pdf' }],
    });
    assert.equal(calls.length, 2);
    assert.equal(calls[0][1].get('to'), 'kamaracomputers@gmail.com');
    assert.equal(calls[1][1].get('to'), 'client@example.test');
    for (const call of calls) {
      assert.equal(call[0], 'https://api.eu.mailgun.net/v3/example.test/messages');
      assert.equal(call[1].get('h:Reply-To'), 'kamaracomputers@gmail.com');
      assert.equal(call[1].get('attachment').name, 'invoice.pdf');
      assert.equal(await call[1].get('attachment').text(), '%PDF-test');
      assert.equal(call[2].auth.password, 'test-key');
    }
    axios.post = async () => {
      const error = new Error('test-key and private message');
      error.response = { status: 401 };
      throw error;
    };
    await assert.rejects(() => sendAdminEmail({ to: 'client@example.test', firstName: 'Ava', subject: 'Invoice', message: 'Hello' }),
      error => /HTTP 401/.test(error.message) && /recipient email was not attempted/.test(error.message) && !error.message.includes('test-key'));
    config.mailPass = '';
    await assert.rejects(() => sendAdminEmail({ to: 'client@example.test', firstName: 'Ava', subject: 'Invoice', message: 'Hello' }), /Mailgun/);
  } finally {
    axios.post = originalPost;
  }
});
