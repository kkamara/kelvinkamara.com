'use strict';
const asyncHandler = require('express-async-handler');
const { status } = require('http-status');
const db = require('../../../../models/V1');
const { invoicePdf, agreementPdf, paymentCsv } = require('../../../../services/adminDocuments');
const { sendAdminEmail } = require('../../../../services/adminEmail');
const { createInvoicePaymentLink, getStripeKeyFingerprint } = require('../../../../services/adminStripe');
const { randomUUID } = require('node:crypto');

const query = (sql, replacements = {}) => db.sequelize.query(sql, {
  replacements, type: db.Sequelize.QueryTypes.SELECT,
});
const insert = (sql, replacements) => db.sequelize.query(sql, {
  replacements, type: db.Sequelize.QueryTypes.INSERT,
});
const update = (sql, replacements) => db.sequelize.query(sql, {
  replacements, type: db.Sequelize.QueryTypes.UPDATE,
});
function fail(res, code, message) {
  res.status(code);
  throw new Error(message);
}
function string(res, value, label, max, required = true) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) {
    fail(res, status.BAD_REQUEST, `${label} is invalid.`);
  }
  return value.trim();
}
function id(res, value) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) fail(res, status.BAD_REQUEST, 'Invalid ID.');
  return number;
}
function date(res, value, label) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) {
    fail(res, status.BAD_REQUEST, `${label} is invalid.`);
  }
  return value;
}
function amount(res, value) {
  if (!Number.isSafeInteger(value) || value < 1 || value > 2147483647) {
    fail(res, status.BAD_REQUEST, 'Amount must be a positive number of pence.');
  }
  return value;
}
async function client(res, clientId) {
  const rows = await query('SELECT * FROM adminClients WHERE id = :id', { id: clientId });
  if (!rows.length) fail(res, status.NOT_FOUND, 'Client not found.');
  return rows[0];
}
const fields = table => table === 'adminInvoices' ?
  'r.id, r.clientId, r.description, r.amountPence, r.dueDate, r.paymentInstructions, r.paymentLink, r.createdAt, r.updatedAt' : 'r.*';
async function record(res, table, recordId) {
  const rows = await query(
    `SELECT ${fields(table)}, c.firstName, c.lastName, c.email FROM ${table} r JOIN adminClients c ON c.id = r.clientId WHERE r.id = :id`,
    { id: recordId },
  );
  if (!rows.length) fail(res, status.NOT_FOUND, 'Record not found.');
  return rows[0];
}
const list = table => asyncHandler(async (req, res) => {
  const rows = await query(`SELECT ${fields(table)}, c.firstName, c.lastName, c.email FROM ${table} r JOIN adminClients c ON c.id = r.clientId ORDER BY r.id DESC`);
  res.json({ data: rows });
});
const clientData = (res, body) => {
  const data = {
    firstName: string(res, body.firstName, 'First name', 100),
    lastName: string(res, body.lastName, 'Last name', 100),
    email: string(res, body.email, 'Email', 254),
    company: string(res, body.company || '', 'Company', 200, false),
    phone: string(res, body.phone || '', 'Phone', 50, false),
    notes: string(res, body.notes || '', 'Notes', 10000, false),
  };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) fail(res, status.BAD_REQUEST, 'Email is invalid.');
  return data;
};
exports.clients = asyncHandler(async (req, res) => res.json({ data: await query('SELECT * FROM adminClients ORDER BY lastName, firstName') }));
exports.createClient = asyncHandler(async (req, res) => {
  const data = clientData(res, {
    firstName: req.bodyString("firstName"),
    lastName: req.bodyString("lastName"),
    email: req.bodyString("email"),
    company: req.bodyString("company") || '',
    phone: req.bodyString("phone") || '',
    notes: req.bodyString("notes") || '',
  });
  const [newId] = await insert('INSERT INTO adminClients (firstName, lastName, email, company, phone, notes, createdAt, updatedAt) VALUES (:firstName, :lastName, :email, :company, :phone, :notes, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', data);
  res.status(status.CREATED).json({ data: await client(res, newId) });
});
exports.updateClient = asyncHandler(async (req, res) => {
  const clientId = req.paramInt("id");
  await client(res, clientId);
  const sanitizedData = {
    firstName: req.bodyString("firstName"),
    lastName: req.bodyString("lastName"),
    email: req.bodyString("email"),
    company: req.bodyString("company") || '',
    phone: req.bodyString("phone") || '',
    notes: req.bodyString("notes") || '',
  };
  await update('UPDATE adminClients SET firstName=:firstName, lastName=:lastName, email=:email, company=:company, phone=:phone, notes=:notes, updatedAt=CURRENT_TIMESTAMP WHERE id=:id', { ...clientData(res, sanitizedData), id: clientId });
  res.json({ data: await client(res, clientId) });
});
exports.invoices = list('adminInvoices');
exports.agreements = list('adminAgreements');
exports.payments = list('adminPayments');
exports.subscriptions = asyncHandler(async (req, res) => {
  const clientId = id(res, req.paramInt('id'));
  await client(res, clientId);
  res.json({ data: await query('SELECT * FROM adminSubscriptions WHERE clientId=:clientId ORDER BY id DESC', { clientId }) });
});
exports.createSubscription = asyncHandler(async (req, res) => {
  const data = {
    clientId: id(res, req.bodyInt('clientId')),
    serviceName: string(res, req.bodyString('serviceName'), 'Service name', 255),
  };
  await client(res, data.clientId);
  const [newId] = await insert('INSERT INTO adminSubscriptions (clientId, serviceName, startDate, isActive, createdAt, updatedAt) VALUES (:clientId, :serviceName, CURRENT_TIMESTAMP, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', data);
  res.status(status.CREATED).json({ data: await record(res, 'adminSubscriptions', newId) });
});
exports.updateSubscription = asyncHandler(async (req, res) => {
  const subscriptionId = id(res, req.paramInt('id'));
  const isActive = req.body.isActive;
  if (typeof isActive !== 'boolean') fail(res, status.BAD_REQUEST, 'Active status must be true or false.');
  await record(res, 'adminSubscriptions', subscriptionId);
  await update('UPDATE adminSubscriptions SET isActive=:isActive, endDate=CASE WHEN :isActive THEN NULL ELSE CURRENT_TIMESTAMP END, updatedAt=CURRENT_TIMESTAMP WHERE id=:id', { id: subscriptionId, isActive });
  res.json({ data: await record(res, 'adminSubscriptions', subscriptionId) });
});
const agreementText = (res, body) => ({
  title: string(res, body.title, 'Title', 200),
  body: string(res, body.body, 'Agreement text', 50000),
});
async function agreementTemplate(res, templateId) {
  const rows = await query('SELECT * FROM adminAgreementTemplates WHERE id=:id', { id: templateId });
  if (!rows.length) fail(res, status.NOT_FOUND, 'Agreement template not found.');
  return rows[0];
}
exports.agreementTemplates = asyncHandler(async (req, res) => {
  res.json({ data: await query('SELECT * FROM adminAgreementTemplates ORDER BY title, id') });
});
exports.createAgreementTemplate = asyncHandler(async (req, res) => {
  const sanitizedData = {
    title: req.bodyString("title"),
    body: req.bodyString("body"),
  };
  const data = agreementText(res, sanitizedData);
  const [newId] = await insert('INSERT INTO adminAgreementTemplates (title, body, createdAt, updatedAt) VALUES (:title, :body, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', data);
  res.status(status.CREATED).json({ data: await agreementTemplate(res, newId) });
});
exports.updateAgreementTemplate = asyncHandler(async (req, res) => {
  const templateId = req.paramInt("id");
  await agreementTemplate(res, templateId);
  const sanitizedData = {
    title: req.bodyString("title"),
    body: req.bodyString("body"),
  };
  await update('UPDATE adminAgreementTemplates SET title=:title, body=:body, updatedAt=CURRENT_TIMESTAMP WHERE id=:id', { ...agreementText(res, sanitizedData), id: templateId });
  res.json({ data: await agreementTemplate(res, templateId) });
});
const deleteRecord = (table, label) => asyncHandler(async (req, res) => {
  const count = await db.sequelize.query(`DELETE FROM ${table} WHERE id=:id`, {
    replacements: { id: req.paramInt("id") }, type: db.Sequelize.QueryTypes.BULKDELETE,
  });
  if (!count) fail(res, status.NOT_FOUND, `${label} not found.`);
  res.status(status.NO_CONTENT).end();
});
exports.deleteAgreementTemplate = deleteRecord('adminAgreementTemplates', 'Agreement template');
exports.deleteAgreement = deleteRecord('adminAgreements', 'Agreement');
exports.createInvoice = asyncHandler(async (req, res) => {
  const rawData = {
    clientId: req.bodyInt("clientId"),
    description: req.bodyString("description"),
    amountPence: req.bodyInt("amountPence"),
    dueDate: req.bodyString("dueDate"),
    paymentInstructions: req.bodyString("paymentInstructions") || '',
    paymentLink: req.bodyString("paymentLink") || '',
  };
  
  const data = {
    clientId: id(res, rawData.clientId),
    description: string(res, rawData.description, 'Description', 10000),
    amountPence: amount(res, rawData.amountPence),
    dueDate: date(res, rawData.dueDate, 'Due date'),
    paymentInstructions: string(res, rawData.paymentInstructions, 'Payment instructions', 10000, false),
    paymentLink: string(res, rawData.paymentLink, 'Payment link', 2048, false),
    stripeRequestKey: randomUUID(),
  };
  
  if (data.paymentLink) {
    let url;
    try { url = new URL(data.paymentLink); } catch { fail(res, status.BAD_REQUEST, 'Payment link must be a valid HTTPS URL.'); }
    if (url.protocol !== 'https:' || url.username || url.password) fail(res, status.BAD_REQUEST, 'Payment link must be a valid HTTPS URL.');
  }
  await client(res, data.clientId);
  const [newId] = await insert('INSERT INTO adminInvoices (clientId, description, amountPence, dueDate, paymentInstructions, paymentLink, stripeRequestKey, createdAt, updatedAt) VALUES (:clientId, :description, :amountPence, :dueDate, :paymentInstructions, :paymentLink, :stripeRequestKey, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', data);
  res.status(status.CREATED).json({ data: await record(res, 'adminInvoices', newId) });
});
exports.createStripeLink = asyncHandler(async (req, res) => {
  const invoiceId = req.paramInt("id");
  const fingerprint = getStripeKeyFingerprint();
  await db.sequelize.transaction(async transaction => {
    const options = { replacements: { id: invoiceId }, type: db.Sequelize.QueryTypes.SELECT, transaction };
    const invoices = await db.sequelize.query('SELECT *, TIMESTAMPDIFF(SECOND, stripeAttemptAt, CURRENT_TIMESTAMP) AS stripeAttemptAge FROM adminInvoices WHERE id=:id FOR UPDATE', options);
    if (!invoices.length) fail(res, status.NOT_FOUND, 'Invoice not found.');
    const invoice = invoices[0];
    if (invoice.paymentLink) fail(res, status.CONFLICT, 'This invoice already has a payment link.');
    const payments = await db.sequelize.query('SELECT id FROM adminPayments WHERE invoiceId=:id LIMIT 1', options);
    if (payments.length) fail(res, status.CONFLICT, 'A payment has already been recorded against this invoice.');
    if (invoice.stripeAttemptAt) {
      if (invoice.stripeKeyFingerprint !== fingerprint || invoice.stripeAttemptAge < 0 || invoice.stripeAttemptAge >= 23 * 60 * 60) {
        fail(res, status.CONFLICT, 'Automatic retry is unavailable. Check Stripe for an existing link before resolving this invoice.');
      }
    } else {
      await db.sequelize.query('UPDATE adminInvoices SET stripeAttemptAt=CURRENT_TIMESTAMP, stripeKeyFingerprint=:fingerprint WHERE id=:id', {
        replacements: { id: invoiceId, fingerprint }, transaction,
      });
    }
  });
  await db.sequelize.transaction(async transaction => {
    const options = { replacements: { id: invoiceId }, type: db.Sequelize.QueryTypes.SELECT, transaction };
    const invoices = await db.sequelize.query('SELECT *, TIMESTAMPDIFF(SECOND, stripeAttemptAt, CURRENT_TIMESTAMP) AS stripeAttemptAge FROM adminInvoices WHERE id=:id FOR UPDATE', options);
    if (!invoices.length) fail(res, status.NOT_FOUND, 'Invoice not found.');
    const invoice = invoices[0];
    if (invoice.paymentLink) fail(res, status.CONFLICT, 'This invoice already has a payment link.');
    if (invoice.stripeKeyFingerprint !== fingerprint || invoice.stripeAttemptAge < 0 || invoice.stripeAttemptAge >= 23 * 60 * 60) {
      fail(res, status.CONFLICT, 'Automatic retry is unavailable. Check Stripe for an existing link before resolving this invoice.');
    }
    const payments = await db.sequelize.query('SELECT id FROM adminPayments WHERE invoiceId=:id LIMIT 1', options);
    if (payments.length) fail(res, status.CONFLICT, 'A payment has already been recorded against this invoice.');
    const paymentLink = await createInvoicePaymentLink(invoice);
    await db.sequelize.query('UPDATE adminInvoices SET paymentLink=:paymentLink, updatedAt=CURRENT_TIMESTAMP WHERE id=:id', {
      replacements: { id: invoiceId, paymentLink }, transaction,
    });
  });
  res.json({ data: await record(res, 'adminInvoices', invoiceId) });
});
exports.createAgreement = asyncHandler(async (req, res) => {
  const sanitizedData = {
    title: req.bodyString("title"),
    body: req.bodyString("body"),
  };
  const clientId = id(res, req.bodyInt("clientId"));
  const data = { clientId, ...agreementText(res, sanitizedData) };
  await client(res, clientId);
  const [newId] = await insert('INSERT INTO adminAgreements (clientId, title, body, signed, createdAt, updatedAt) VALUES (:clientId, :title, :body, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', data);
  res.status(status.CREATED).json({ data: await record(res, 'adminAgreements', newId) });
});
exports.updateAgreement = asyncHandler(async (req, res) => {
  const agreementId = req.paramInt("id");
  const signedValue = req.body.signed;
  if (typeof signedValue !== 'boolean') fail(res, status.BAD_REQUEST, 'Signed status must be true or false.');
  await record(res, 'adminAgreements', agreementId);
  await update('UPDATE adminAgreements SET signed=:signed, updatedAt=CURRENT_TIMESTAMP WHERE id=:id', { id: agreementId, signed: signedValue });
  res.json({ data: await record(res, 'adminAgreements', agreementId) });
});
exports.createPayment = asyncHandler(async (req, res) => {
  const rawData = {
    clientId: req.bodyInt("clientId"),
    invoiceId: req.body.invoiceId ? req.bodyInt("invoiceId") : null,
    amountPence: req.bodyInt("amountPence"),
    paidDate: req.bodyString("paidDate"),
    method: req.bodyString("method"),
    details: req.bodyString("details") || '',
  };
  
  const data = {
    clientId: id(res, rawData.clientId),
    invoiceId: rawData.invoiceId ? id(res, rawData.invoiceId) : null,
    amountPence: amount(res, rawData.amountPence),
    paidDate: date(res, rawData.paidDate, 'Payment date'),
    method: string(res, rawData.method, 'Payment method', 100),
    details: string(res, rawData.details, 'Details', 10000, false),
  };
  
  await client(res, data.clientId);
  const [newId] = await db.sequelize.transaction(async transaction => {
    if (data.invoiceId) {
      const invoices = await db.sequelize.query('SELECT id, clientId FROM adminInvoices WHERE id=:id FOR UPDATE', {
        replacements: { id: data.invoiceId }, type: db.Sequelize.QueryTypes.SELECT, transaction,
      });
      if (!invoices.length) fail(res, status.NOT_FOUND, 'Invoice not found.');
      if (invoices[0].clientId !== data.clientId) fail(res, status.BAD_REQUEST, 'Invoice belongs to a different client.');
    }
    return db.sequelize.query('INSERT INTO adminPayments (clientId, invoiceId, amountPence, paidDate, method, details, createdAt, updatedAt) VALUES (:clientId, :invoiceId, :amountPence, :paidDate, :method, :details, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', {
      replacements: data, type: db.Sequelize.QueryTypes.INSERT, transaction,
    });
  });
  res.status(status.CREATED).json({ data: await record(res, 'adminPayments', newId) });
});
async function paymentsForClient(res, clientId) {
  await client(res, clientId);
  return query('SELECT p.*, c.firstName, c.lastName, c.email FROM adminPayments p JOIN adminClients c ON c.id=p.clientId WHERE p.clientId=:clientId ORDER BY p.paidDate DESC, p.id DESC', { clientId });
}
const attachment = (filename, content, contentType) => ({ filename, content, contentType });
function download(res, item) {
  res.type(item.contentType);
  res.attachment(item.filename);
  res.send(item.content);
}
exports.invoiceDocument = asyncHandler(async (req, res) => {
  const invoice = await record(res, 'adminInvoices', req.paramInt("id"));
  download(res, attachment(`invoice-${invoice.id}.pdf`, await invoicePdf(invoice), 'application/pdf'));
});
exports.agreementDocument = asyncHandler(async (req, res) => {
  const agreement = await record(res, 'adminAgreements', req.paramInt("id"));
  download(res, attachment(`agreement-${agreement.id}.pdf`, await agreementPdf(agreement), 'application/pdf'));
});
exports.exportPayments = asyncHandler(async (req, res) => {
  const clientId = req.paramInt("id");
  download(res, attachment(`payments-${clientId}.csv`, paymentCsv(await paymentsForClient(res, clientId)), 'text/csv'));
});
exports.emailInvoice = asyncHandler(async (req, res) => {
  const invoice = await record(res, 'adminInvoices', req.paramInt("id"));
  await sendAdminEmail({ to: invoice.email, firstName: invoice.firstName, subject: `Invoice #${invoice.id}`, message: `Please find your invoice attached. Payment is due ${invoice.dueDate}.\n\n${invoice.paymentInstructions}`, paymentLink: invoice.paymentLink, attachments: [attachment(`invoice-${invoice.id}.pdf`, await invoicePdf(invoice), 'application/pdf')] });
  res.json({ message: 'Invoice email sent.' });
});
exports.emailAgreement = asyncHandler(async (req, res) => {
  const agreement = await record(res, 'adminAgreements', req.paramInt("id"));
  await sendAdminEmail({ to: agreement.email, firstName: agreement.firstName, subject: agreement.title, message: 'Please review the attached service agreement, sign it and return it to me.', attachments: [attachment(`agreement-${agreement.id}.pdf`, await agreementPdf(agreement), 'application/pdf')] });
  res.json({ message: 'Agreement email sent.' });
});
exports.emailPayments = asyncHandler(async (req, res) => {
  const clientId = req.paramInt("id");
  const recipient = await client(res, clientId);
  const csv = paymentCsv(await paymentsForClient(res, clientId));
  await sendAdminEmail({ to: recipient.email, firstName: recipient.firstName, subject: 'Your payment history', message: 'Please find your recorded payment history attached.', attachments: [attachment(`payments-${clientId}.csv`, csv, 'text/csv')] });
  res.json({ message: 'Payment history email sent.' });
});
exports.emailClient = asyncHandler(async (req, res) => {
  const recipient = await client(res, req.paramInt("id"));
  const subject = req.bodyString("subject");
  if (/[\r\n]/.test(subject)) fail(res, status.BAD_REQUEST, 'Subject must be a single line.');
  const message = req.bodyString("message");
  const sanitizedSubject = string(res, subject, 'Subject', 200);
  const sanitizedMessage = string(res, message, 'Message', 10000);
  await sendAdminEmail({ to: recipient.email, firstName: recipient.firstName, subject: sanitizedSubject, message: sanitizedMessage });
  res.json({ message: 'Email sent.' });
});
