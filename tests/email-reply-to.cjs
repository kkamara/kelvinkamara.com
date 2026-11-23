'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
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
    config.mailUser = '';
    assert.equal(await testSendEmail({ to: 'recipient@example.test', plainText: 'Test', html: '<p>Test</p>' }), true);
    assert.equal(await sendEmail({ to: 'recipient@example.test', plainText: 'Test', html: '<p>Test</p>' }), true);
    assert.equal(await sendContactEmail({ name: 'Visitor', email: 'visitor@example.test', message: 'Hello' }), true);
    await sendAdminEmail({ to: 'client@example.test', firstName: 'Ava', subject: 'Invoice', message: 'Hello' });
    assert.equal(messages.length, 7);
    assert.equal(messages[0].replyTo, 'kamaracomputers@gmail.com');
    assert.equal(messages[1].replyTo, 'kamaracomputers@gmail.com');
    assert.equal(messages[2].replyTo, 'kamaracomputers@gmail.com');
    assert.equal(messages[3].replyTo, 'kamaracomputers@gmail.com');
    assert.equal(messages[4].replyTo, 'visitor@example.test');
    assert.equal(messages[5].replyTo, 'kamaracomputers@gmail.com');
    assert.equal(messages[6].replyTo, 'kamaracomputers@gmail.com');
    for (const [copy, recipient] of [[messages[0], messages[1]], [messages[2], messages[3]], [messages[5], messages[6]]]) {
      assert.equal(copy.to, 'kamaracomputers@gmail.com');
      assert.equal(copy.subject, `Fwd: [Copy for ${recipient.to}] ${recipient.subject}`);
      assert.equal(copy.text, recipient.text);
      assert.equal(copy.html, recipient.html);
    }
    assert.match(messages[4].text, /visitor@example\.test/);
    assert.match(messages[4].html, /visitor@example\.test/);
    assert.equal(messages[4].to, 'recipient@example.test');
  } finally {
    nodemailer.createTransport = originalTransport;
    Object.assign(config, originalConfig);
  }
});

test('all SMTP emails from production also use configured reply-to and preserve sender', async () => {
  const originalTransport = nodemailer.createTransport;
  const originalConfig = { ...config };
  const messages = [];
  nodemailer.createTransport = () => ({ sendMail: async message => messages.push(message) });
  try {
    config.nodeEnv = 'production';
    config.mailHost = 'smtp.example.test';
    config.mailPort = 587;
    config.mailSecure = false;
    config.mailUser = 'apiuser';
    config.mailPass = 'apikey';
    config.mailFrom = 'sender@example.test';
    config.mailTo = 'recipient@example.test';
    config.mailSubject = 'Contact';
    assert.equal(await sendContactEmail({ name: 'Visitor', email: 'visitor@example.test', message: 'Hello' }), true);
    await sendAdminEmail({ to: 'client@example.test', firstName: 'Ava', subject: 'Invoice', message: 'Hello' });
    assert.equal(messages.length, 3);
    assert.equal(messages[0].replyTo, 'visitor@example.test');
    assert.equal(messages[1].replyTo, 'kamaracomputers@gmail.com');
    assert.equal(messages[2].replyTo, 'kamaracomputers@gmail.com');
    assert.match(messages[0].text, /visitor@example\.test/);
    assert.match(messages[0].html, /visitor@example\.test/);
    assert.equal(messages[0].to, 'recipient@example.test');
    assert.equal(messages[1].to, 'kamaracomputers@gmail.com');
    assert.equal(messages[2].to, 'client@example.test');
    assert.equal(messages[1].subject, 'Fwd: [Copy for client@example.test] Invoice');
    assert.equal(messages[1].text, messages[2].text);
    assert.equal(messages[1].html, messages[2].html);
  } finally {
    nodemailer.createTransport = originalTransport;
    Object.assign(config, originalConfig);
  }
});

test('SMTP failure stops the sequence and reports which send failed', async () => {
  const originalTransport = nodemailer.createTransport;
  const originalConfig = { ...config };
  const attempts = [];
  let failureAt = 1;
  nodemailer.createTransport = () => ({
    sendMail: async message => {
      attempts.push(message);
      if (attempts.length === failureAt) return { rejected: [message.to] };
      return { rejected: [] };
    },
  });
  try {
    config.nodeEnv = 'development';
    config.mailHost = 'mailhog';
    config.mailFrom = 'sender@example.test';
    config.mailUser = '';
    await assert.rejects(() => sendEmail({ to: 'client@example.test', plainText: 'Test', html: '<p>Test</p>' }), /recipient email was not attempted/);
    assert.deepEqual(attempts.map(message => message.to), ['kamaracomputers@gmail.com']);
    attempts.length = 0;
    failureAt = 2;
    await assert.rejects(() => sendAdminEmail({ to: 'client@example.test', firstName: 'Ava', subject: 'Invoice', message: 'Hello' }), /copy was accepted.*recipient email could not be sent/i);
    assert.deepEqual(attempts.map(message => message.to), ['kamaracomputers@gmail.com', 'client@example.test']);
  } finally {
    nodemailer.createTransport = originalTransport;
    Object.assign(config, originalConfig);
  }
});
