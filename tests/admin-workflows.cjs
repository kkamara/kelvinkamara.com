'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const sanitize = require('sanitize');

test('private admin workflows against an isolated MySQL database', async () => {
  const port = Number(process.env.ADMIN_TEST_DB_PORT);
  const database = process.env.ADMIN_TEST_DB_NAME || 'admin_validation';
  if (!port) throw new Error('ADMIN_TEST_DB_PORT must point to a new, empty isolated test database.');
  if (!/^admin_validation(?:_[a-z0-9]+)?$/.test(database)) throw new Error('Use an isolated admin_validation database.');
  process.env.NODE_ENV = 'test';
  process.env.DB_HOST = '127.0.0.1';
  const config = require('../config.json');
  config.test = { dialect: 'mysql', host: '127.0.0.1', port, username: 'root', password: 'validation-only', database };
  const db = require('../src/models/V1');
  const emails = [];
  const mail = require('../src/services/adminEmail');
  mail.sendAdminEmail = async email => {
    if (email.subject === 'Simulate failure') throw new Error('Mail delivery failed');
    emails.push(email);
  };
  const stripe = require('../src/services/adminStripe');
  let stripeCalls = 0;
  let failStripe = false;
  let fingerprint = 'test-fingerprint';
  stripe.getStripeKeyFingerprint = () => fingerprint;
  stripe.createInvoicePaymentLink = async invoice => {
    stripeCalls += 1;
    if (failStripe) throw new Error('Stripe unavailable');
    return `https://buy.stripe.com/test-${invoice.id}`;
  };
  const { encrypt } = require('../src/utils/tokens');
  const app = express();
  app.use(express.json(), sanitize.middleware, (req, res, next) => { req.session = {}; next(); });
  app.use('/user', require('../src/routes/API/V1/web/userRoutes'));
  app.use('/admin', require('../src/routes/API/V1/web/adminRoutes'));
  app.use(require('../src/middlewares/V1/errorMiddleware').jsonError);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, method = 'GET', body, token) => {
    const response = await fetch(base + path, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('json') ? await response.json() : Buffer.from(await response.arrayBuffer());
    return { response, data };
  };
  try {
    const qi = db.sequelize.getQueryInterface();
    for (const migration of [
      '../src/migrations/V1/20230814135417-create-users-table',
      '../src/migrations/V1/20230815125410-create-user-tokens-table',
      '../src/migrations/V1/20261120235000-create-admin-tables',
      '../src/migrations/V1/20261121010000-protect-stripe-link-retries',
    ]) await require(migration).up(qi, db.Sequelize);
    const password = 'Test-only$1';
    const hashed = encrypt(password);
    require('../src/config').adminPassword = password;
    await require('../src/seeders/V1/20261116150704-create-admin-user').up(qi, db.Sequelize);
    const login = await request('/user', 'POST', { email: 'kamaracomputers@gmail.com', password });
    assert.equal(login.response.status, 200);
    const token = login.data.data.authToken;
    assert.equal((await request('/admin/clients')).response.status, 401);
    const userId = (await db.sequelize.query(
      "INSERT INTO users (firstName, lastName, email, password, passwordSalt, createdAt, updatedAt) VALUES ('Other', 'User', 'other@example.test', :password, :salt, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
      { replacements: { password: hashed.hash, salt: hashed.salt }, type: db.Sequelize.QueryTypes.INSERT, logging: false },
    ))[0];
    const otherTokenId = (await db.sequelize.models.userToken.createAuthToken(userId)).authTokenId;
    const otherToken = (await db.sequelize.models.userToken.getAuthToken(otherTokenId)).token;
    assert.equal((await request('/admin/clients', 'GET', undefined, otherToken)).response.status, 403);
    assert.notEqual((await request('/user/register', 'POST', {}, token)).response.status, 200);
    const newClient = { firstName: 'Ava', lastName: 'Tester', email: 'ava@example.test', company: '', phone: '', notes: '' };
    const first = await request('/admin/clients', 'POST', newClient, token);
    assert.equal(first.response.status, 201);
    const clientId = first.data.data.id;
    assert.equal((await request(`/admin/clients/${clientId}`, 'PUT', { ...newClient, company: 'Test Ltd' }, token)).data.data.company, 'Test Ltd');
    const second = await request('/admin/clients', 'POST', { ...newClient, email: 'second@example.test' }, token);
    const invoice = { clientId, description: 'Website work', amountPence: 10250, dueDate: '2026-12-01', paymentInstructions: 'Bank transfer', paymentLink: '' };
    assert.equal((await request('/admin/invoices', 'POST', { ...invoice, dueDate: '2026-02-30' }, token)).response.status, 400);
    assert.equal((await request('/admin/invoices', 'POST', { ...invoice, paymentLink: 'http://example.test' }, token)).response.status, 400);
    const createdInvoice = await request('/admin/invoices', 'POST', invoice, token);
    assert.equal(createdInvoice.response.status, 201);
    const invoiceId = createdInvoice.data.data.id;
    const pdf = await request(`/admin/invoices/${invoiceId}/document`, 'GET', undefined, token);
    assert.equal(pdf.response.status, 200);
    assert.equal(pdf.data.subarray(0, 5).toString(), '%PDF-');
    assert.equal((await request(`/admin/invoices/${invoiceId}/email`, 'POST', {}, token)).response.status, 200);
    assert.equal(emails.at(-1).attachments[0].content.subarray(0, 5).toString(), '%PDF-');
    assert.match(emails.at(-1).message, /Bank transfer/);
    const link = await request(`/admin/invoices/${invoiceId}/stripe-link`, 'POST', {}, token);
    assert.equal(link.response.status, 200);
    assert.equal(link.data.data.paymentLink, `https://buy.stripe.com/test-${invoiceId}`);
    assert.equal(link.data.data.stripeKeyFingerprint, undefined);
    assert.equal(link.data.data.stripeRequestKey, undefined);
    assert.equal((await request(`/admin/invoices/${invoiceId}/stripe-link`, 'POST', {}, token)).response.status, 409);
    const retryInvoice = (await request('/admin/invoices', 'POST', invoice, token)).data.data;
    failStripe = true;
    assert.equal((await request(`/admin/invoices/${retryInvoice.id}/stripe-link`, 'POST', {}, token)).response.status, 500);
    failStripe = false;
    assert.equal((await request(`/admin/invoices/${retryInvoice.id}/stripe-link`, 'POST', {}, token)).response.status, 200);
    const expiredInvoice = (await request('/admin/invoices', 'POST', invoice, token)).data.data;
    failStripe = true;
    assert.equal((await request(`/admin/invoices/${expiredInvoice.id}/stripe-link`, 'POST', {}, token)).response.status, 500);
    failStripe = false;
    const callsBeforeBlockedRetries = stripeCalls;
    fingerprint = 'different-key';
    assert.equal((await request(`/admin/invoices/${expiredInvoice.id}/stripe-link`, 'POST', {}, token)).response.status, 409);
    fingerprint = 'test-fingerprint';
    await db.sequelize.query('UPDATE adminInvoices SET stripeAttemptAt=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 23 HOUR) WHERE id=:id', {
      replacements: { id: expiredInvoice.id },
    });
    assert.equal((await request(`/admin/invoices/${expiredInvoice.id}/stripe-link`, 'POST', {}, token)).response.status, 409);
    assert.equal(stripeCalls, callsBeforeBlockedRetries);
    const agreement = await request('/admin/agreements', 'POST', { clientId, title: 'Services', body: 'The agreed terms.' }, token);
    assert.equal(agreement.response.status, 201);
    const agreementId = agreement.data.data.id;
    assert.equal((await request(`/admin/agreements/${agreementId}`, 'PATCH', { signed: true }, token)).data.data.signed, 1);
    assert.equal((await request(`/admin/agreements/${agreementId}/email`, 'POST', {}, token)).response.status, 200);
    const payment = { clientId, invoiceId, amountPence: 10000, paidDate: '2026-11-20', method: 'Transfer', details: '=cmd()' };
    assert.equal((await request('/admin/payments', 'POST', { ...payment, clientId: second.data.data.id }, token)).response.status, 400);
    assert.equal((await request('/admin/payments', 'POST', payment, token)).response.status, 201);
    const paidInvoice = await request('/admin/invoices', 'POST', invoice, token);
    assert.equal((await request('/admin/payments', 'POST', { ...payment, invoiceId: paidInvoice.data.data.id }, token)).response.status, 201);
    assert.equal((await request(`/admin/invoices/${paidInvoice.data.data.id}/stripe-link`, 'POST', {}, token)).response.status, 409);
    const csv = await request(`/admin/clients/${clientId}/payments.csv`, 'GET', undefined, token);
    assert.equal(csv.response.status, 200);
    assert.match(csv.data.toString(), /"'=cmd\(\)"/);
    assert.equal((await request(`/admin/clients/${clientId}/payments/email`, 'POST', {}, token)).response.status, 200);
    assert.equal(emails.at(-1).to, newClient.email);
    assert.equal((await request(`/admin/clients/${clientId}/email`, 'POST', { subject: 'Welcome', message: 'Hello!' }, token)).response.status, 200);
    assert.equal((await request(`/admin/clients/${clientId}/email`, 'POST', { subject: 'Simulate failure', message: 'Hello!' }, token)).response.status, 500);
    assert.equal((await request('/user', 'DELETE', undefined, token)).response.status, 200);
    assert.equal((await request('/admin/clients', 'GET', undefined, token)).response.status, 401);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await db.sequelize.close();
  }
});
