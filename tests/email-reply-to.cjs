'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const nodemailer = require('nodemailer');
const config = require('../src/config');
const { testSendEmail, sendEmail, sendContactEmail } = require('../src/services/email');
const { sendAdminEmail } = require('../src/services/adminEmail');

test('all SMTP emails use the configured reply-to and retain the contact sender', async () => {
  const originalTransport = nodemailer.createTransport;
  const originalConfig = { ...config };
  const messages = [];
  nodemailer.createTransport = () => ({ sendMail: async message => messages.push(message) });
  try {
    config.nodeEnv = 'development';
    config.mailHost = 'mailhog';
    config.mailFrom = 'sender@example.test';
    config.mailTo = 'recipient@example.test';
    config.mailSubject = 'Contact';
    assert.equal(await testSendEmail({ to: 'recipient@example.test', plainText: 'Test', html: '<p>Test</p>' }), true);
    assert.equal(await sendEmail({ to: 'recipient@example.test', plainText: 'Test', html: '<p>Test</p>' }), true);
    assert.equal(await sendContactEmail({ name: 'Visitor', email: 'visitor@example.test', message: 'Hello' }), true);
    await sendAdminEmail({ to: 'client@example.test', firstName: 'Ava', subject: 'Invoice', message: 'Hello' });
    assert.equal(messages.length, 4);
    for (const message of messages) assert.equal(message.replyTo, 'kamaracomputers@gmail.com');
    assert.match(messages[2].text, /visitor@example\.test/);
    assert.match(messages[2].html, /visitor@example\.test/);
  } finally {
    nodemailer.createTransport = originalTransport;
    Object.assign(config, originalConfig);
  }
});

test('contact and admin Mailgun emails set the reply-to header', async () => {
  const originalPost = axios.post;
  const originalConfig = { ...config };
  const calls = [];
  axios.post = async (...args) => { calls.push(args); return { status: 200 }; };
  try {
    config.nodeEnv = 'production';
    config.mailHost = 'mailgun';
    config.mailFrom = 'sender@example.test';
    config.mailTo = 'recipient@example.test';
    config.mailSubject = 'Contact';
    config.mailgunDomain = 'example.test';
    config.mailPass = 'test-key';
    assert.equal(await sendContactEmail({ name: 'Visitor', email: 'visitor@example.test', message: 'Hello' }), true);
    await sendAdminEmail({ to: 'client@example.test', firstName: 'Ava', subject: 'Invoice', message: 'Hello' });
    assert.equal(calls.length, 2);
    for (const [, data] of calls) assert.equal(data.get('h:Reply-To'), 'kamaracomputers@gmail.com');
    assert.match(calls[0][1].get('text'), /visitor@example\.test/);
    assert.match(calls[0][1].get('html'), /visitor@example\.test/);
  } finally {
    axios.post = originalPost;
    Object.assign(config, originalConfig);
  }
});
