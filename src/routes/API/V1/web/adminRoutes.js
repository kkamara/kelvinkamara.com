'use strict';
const express = require('express');
const asyncHandler = require('express-async-handler');
const { status } = require('http-status');
const { authenticate } = require('../../../../middlewares/V1/authMiddleware');
const db = require('../../../../models/V1');
const controller = require('../../../../controllers/API/V1/web/adminControllers');

const router = express.Router();
router.use(authenticate, asyncHandler(async (req, res, next) => {
  const users = await db.sequelize.query(
    'SELECT id FROM users WHERE id = :id AND email = :email AND deletedAt IS NULL',
    { replacements: { id: req.session.userId, email: 'kamaracomputers@gmail.com' }, type: db.Sequelize.QueryTypes.SELECT },
  );
  if (!users.length) return res.status(status.FORBIDDEN).json({ message: 'Administrator access required.' });
  res.set('Cache-Control', 'no-store');
  res.set('X-Robots-Tag', 'noindex, nofollow');
  next();
}));

router.get('/clients', controller.clients);
router.post('/clients', controller.createClient);
router.put('/clients/:id', controller.updateClient);
router.get('/clients/:id/subscriptions', controller.subscriptions);
router.post('/subscriptions', controller.createSubscription);
router.patch('/subscriptions/:id', controller.updateSubscription);
router.get('/invoices', controller.invoices);
router.post('/invoices', controller.createInvoice);
router.post('/invoices/:id/stripe-link', controller.createStripeLink);
router.get('/invoices/:id/document', controller.invoiceDocument);
router.post('/invoices/:id/email', controller.emailInvoice);
router.get('/agreements', controller.agreements);
router.post('/agreements', controller.createAgreement);
router.patch('/agreements/:id', controller.updateAgreement);
router.delete('/agreements/:id', controller.deleteAgreement);
router.get('/agreements/:id/document', controller.agreementDocument);
router.post('/agreements/:id/email', controller.emailAgreement);
router.get('/agreement-templates', controller.agreementTemplates);
router.post('/agreement-templates', controller.createAgreementTemplate);
router.put('/agreement-templates/:id', controller.updateAgreementTemplate);
router.delete('/agreement-templates/:id', controller.deleteAgreementTemplate);
router.get('/payments', controller.payments);
router.post('/payments', controller.createPayment);
router.get('/clients/:id/payments.csv', controller.exportPayments);
router.post('/clients/:id/payments/email', controller.emailPayments);
router.post('/clients/:id/email', controller.emailClient);

module.exports = router;
