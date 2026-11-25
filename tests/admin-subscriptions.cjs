'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const sanitize = require('sanitize');

test('admin subscription handlers use admin client IDs and update subscription status', async () => {
  const modelPath = require.resolve('../src/models/V1');
  const rows = [];
  const db = {
    Sequelize: { QueryTypes: { SELECT: 'select', INSERT: 'insert', UPDATE: 'update' } },
    sequelize: {
      async query(sql, { replacements, type }) {
        if (sql.includes('FROM adminClients WHERE')) return replacements.id === 7 ? [{ id: 7 }] : [];
        if (sql.startsWith('INSERT INTO adminSubscriptions')) {
          rows.push({ id: 1, ...replacements, isActive: 1, endDate: null });
          return [1];
        }
        if (sql.startsWith('UPDATE adminSubscriptions')) {
          Object.assign(rows[0], { isActive: Number(replacements.isActive), endDate: replacements.isActive ? null : 'ended' });
          return [undefined, 1];
        }
        if (sql.includes('FROM adminSubscriptions WHERE clientId')) return rows.filter(row => row.clientId === replacements.clientId);
        if (sql.includes('FROM adminSubscriptions r JOIN adminClients')) return rows.filter(row => row.id === replacements.id);
        throw new Error(`Unexpected query: ${sql} (${type})`);
      },
    },
  };
  const previous = require.cache[modelPath];
  require.cache[modelPath] = { id: modelPath, filename: modelPath, loaded: true, exports: db };
  const controller = require('../src/controllers/API/V1/web/adminControllers');
  const app = express();
  app.use(express.json(), sanitize.middleware);
  app.post('/subscriptions', controller.createSubscription);
  app.get('/clients/:id/subscriptions', controller.subscriptions);
  app.patch('/subscriptions/:id', controller.updateSubscription);
  app.use((err, req, res, next) => res.status(res.statusCode === 200 ? 500 : res.statusCode).json({ message: err.message }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, method, body) => {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  };
  try {
    assert.equal((await request('/subscriptions', 'POST', { clientId: 7, serviceName: '  ' })).status, 400);
    assert.equal((await request('/subscriptions', 'POST', { clientId: 8, serviceName: 'Hosting' })).status, 404);
    const created = await request('/subscriptions', 'POST', { clientId: 7, serviceName: ' Hosting ' });
    assert.equal(created.status, 201);
    assert.equal(created.body.data.serviceName, 'Hosting');
    assert.equal((await request('/clients/7/subscriptions', 'GET')).body.data.length, 1);
    assert.equal((await request('/subscriptions/1', 'PATCH', { isActive: false })).body.data.endDate, 'ended');
    assert.equal((await request('/subscriptions/1', 'PATCH', { isActive: true })).body.data.endDate, null);
    assert.equal((await request('/subscriptions/1', 'PATCH', { isActive: 'false' })).status, 400);
  } finally {
    await new Promise(resolve => server.close(resolve));
    delete require.cache[require.resolve('../src/controllers/API/V1/web/adminControllers')];
    if (previous) require.cache[modelPath] = previous;
    else delete require.cache[modelPath];
  }
});
