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
    assert.equal(messages.length, 7);
    for (const message of messages) assert.equal(message.replyTo, 'kamaracomputers@gmail.com');
    for (const [copy, recipient] of [[messages[0], messages[1]], [messages[2], messages[3]], [messages[5], messages[6]]]) {
      assert.equal(copy.to, 'kamaracomputers@gmail.com');
      assert.equal(copy.subject, `Fwd: [Copy for ${recipient.to}] ${recipient.subject}`);
      assert.equal(copy.text, recipient.text);
      assert.equal(copy.html, recipient.html);
    }
    assert.equal(messages[4].to, 'recipient@example.test');
    assert.match(messages[4].text, /visitor@example\.test/);
    assert.match(messages[4].html, /visitor@example\.test/);
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
    assert.equal(calls.length, 3);
    for (const [, data] of calls) assert.equal(data.get('h:Reply-To'), 'kamaracomputers@gmail.com');
    assert.match(calls[0][1].get('text'), /visitor@example\.test/);
    assert.match(calls[0][1].get('html'), /visitor@example\.test/);
    assert.equal(calls[1][1].get('to'), 'kamaracomputers@gmail.com');
    assert.equal(calls[2][1].get('to'), 'client@example.test');
    assert.equal(calls[1][1].get('subject'), 'Fwd: [Copy for client@example.test] Invoice');
    assert.equal(calls[1][1].get('text'), calls[2][1].get('text'));
    assert.equal(calls[1][1].get('html'), calls[2][1].get('html'));
  } finally {
    axios.post = originalPost;
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

test('Mailgun failures stop before the recipient or report partial success', async () => {
  const originalPost = axios.post;
  const originalConfig = { ...config };
  const attempts = [];
  let failureAt = 1;
  axios.post = async (url, data) => {
    attempts.push(data.get('to'));
    if (attempts.length === failureAt) throw new Error('private provider error');
    return { status: 200 };
  };
  try {
    config.nodeEnv = 'production';
    config.mailFrom = 'sender@example.test';
    config.mailgunDomain = 'example.test';
    config.mailPass = 'test-key';
    const send = () => sendAdminEmail({ to: 'client@example.test', firstName: 'Ava', subject: 'Invoice', message: 'Hello' });
    await assert.rejects(send, error => /recipient email was not attempted/.test(error.message) && !error.message.includes('private provider error'));
    assert.deepEqual(attempts, ['kamaracomputers@gmail.com']);
    attempts.length = 0;
    failureAt = 2;
    await assert.rejects(send, /copy was accepted.*recipient email could not be sent/i);
    assert.deepEqual(attempts, ['kamaracomputers@gmail.com', 'client@example.test']);
  } finally {
    axios.post = originalPost;
    Object.assign(config, originalConfig);
  }
});
