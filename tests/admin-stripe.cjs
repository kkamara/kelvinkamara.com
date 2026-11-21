'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const config = require('../src/config');
const { createInvoicePaymentLink } = require('../src/services/adminStripe');

test('creates a single-use GBP link with an idempotency key and no client data', async () => {
  const originalPost = axios.post;
  config.nodeEnv = 'development';
  config.stripeSecret = 'sk_test_fake';
  let call;
  axios.post = async (...args) => { call = args; return { data: { url: 'https://buy.stripe.com/test-example' } }; };
  try {
    const url = await createInvoicePaymentLink({ id: 17, amountPence: 1234, stripeRequestKey: 'test-request-key', email: 'private@example.test' });
    assert.equal(url, 'https://buy.stripe.com/test-example');
    assert.equal(call[0], 'https://api.stripe.com/v1/payment_links');
    assert.equal(call[1].get('line_items[0][price_data][unit_amount]'), '1234');
    assert.equal(call[1].get('line_items[0][price_data][currency]'), 'gbp');
    assert.equal(call[1].get('restrictions[completed_sessions][limit]'), '1');
    assert.equal(call[2].headers['Idempotency-Key'], 'test-request-key');
    assert.equal(call[2].headers['Stripe-Version'], '2026-11-18.endive');
    assert.doesNotMatch(call[1].toString(), /private/);
    config.nodeEnv = 'production';
    await assert.rejects(() => createInvoicePaymentLink({}), /live Stripe/);
    config.nodeEnv = 'development';
    config.stripeSecret = 'sk_live_fake';
    await assert.rejects(() => createInvoicePaymentLink({}), /test secret/);
    config.stripeSecret = 'sk_test_fake';
    axios.post = async () => { const error = new Error('secret-bearing request'); error.response = { status: 401 }; throw error; };
    await assert.rejects(() => createInvoicePaymentLink({}), error => error.message === 'Stripe could not create the payment link (HTTP 401). Check Stripe before retrying.');
  } finally {
    axios.post = originalPost;
  }
});
