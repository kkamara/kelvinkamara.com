'use strict';
const axios = require('axios');
const { createHash } = require('node:crypto');
const { status } = require('http-status');
const config = require('../config');
const { exposableError } = require('../utils/httpResponses');

function stripeKey() {
  const key = config.stripeSecret || '';
  if (!/^(sk|rk)_(test|live)_/.test(key)) throw exposableError('STRIPE_SECRET must contain a Stripe secret or restricted key.', status.SERVICE_UNAVAILABLE);
  if (config.nodeEnv === 'production' && !/^(sk|rk)_live_/.test(key)) {
    throw exposableError('Production requires a live Stripe secret key.', status.SERVICE_UNAVAILABLE);
  }
  if (config.nodeEnv === 'development' && !/^(sk|rk)_test_/.test(key)) {
    throw exposableError('Development requires a Stripe test secret key.', status.SERVICE_UNAVAILABLE);
  }
  return key;
}

function getStripeKeyFingerprint() {
  return createHash('sha256').update(stripeKey()).digest('hex');
}

async function createInvoicePaymentLink(invoice) {
  const key = stripeKey();
  const data = new URLSearchParams({
    'line_items[0][price_data][product_data][name]': `Kel Kamara invoice #${invoice.id}`,
    'line_items[0][price_data][currency]': 'gbp',
    'line_items[0][price_data][unit_amount]': String(invoice.amountPence),
    'line_items[0][quantity]': '1',
    'restrictions[completed_sessions][limit]': '1',
  });
  let response;
  try {
    response = await axios.post('https://api.stripe.com/v1/payment_links', data, {
      auth: { username: key, password: '' },
      headers: { 'Idempotency-Key': invoice.stripeRequestKey, 'Stripe-Version': '2026-11-18.endive' },
      timeout: 15000,
    });
  } catch (error) {
    const code = error.response?.status;
    const detail = Number.isInteger(code) && code >= 400 && code <= 599 ? ` (HTTP ${code})` : '';
    throw exposableError(`Stripe could not create the payment link${detail}. Check Stripe before retrying.`, status.BAD_GATEWAY);
  }
  let link;
  try { link = new URL(response.data.url); } catch { throw exposableError('Stripe returned an invalid payment link. Check Stripe before retrying.', status.BAD_GATEWAY); }
  if (link.protocol !== 'https:' || link.username || link.password || response.data.url.length > 2048) {
    throw exposableError('Stripe returned an invalid payment link. Check Stripe before retrying.', status.BAD_GATEWAY);
  }
  return response.data.url;
}

module.exports = { createInvoicePaymentLink, getStripeKeyFingerprint };
