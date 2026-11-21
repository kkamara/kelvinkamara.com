'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'production';
const { jsonError } = require('../src/middlewares/V1/errorMiddleware');
const { exposableError } = require('../src/utils/httpResponses');

test('production server errors do not expose internal details', () => {
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    send(body) { this.body = body; return this; },
  };
  const original = console.error;
  const output = [];
  console.error = (...parts) => output.push(parts.join(' '));
  try {
    jsonError(new Error('private data or credential'), {}, res, () => {});
    assert.equal(res.statusCode, 500);
    assert.doesNotMatch(JSON.stringify(res.body), /private data or credential/);
    assert.doesNotMatch(output.join(' '), /private data or credential/);
  } finally {
    console.error = original;
  }
});

test('returns explicitly safe service failures to the administrator', () => {
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    send(body) { this.body = body; return this; },
  };
  const original = console.error;
  console.error = () => {};
  try {
    jsonError(exposableError('Check Stripe before retrying.', 502), {}, res, () => {});
    assert.equal(res.statusCode, 502);
    assert.equal(res.body.message, 'Check Stripe before retrying.');
  } finally {
    console.error = original;
  }
});

test('preserves HTTP status codes from middleware errors', () => {
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    send(body) { this.body = body; return this; },
  };
  const error = new Error('Not found');
  error.status = 404;
  jsonError(error, {}, res, () => {});
  assert.equal(res.statusCode, 404);
});
