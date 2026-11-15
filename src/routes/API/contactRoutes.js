'use strict';
const express = require('express');
const { contact } = require('../controllers/contactControllers');
const { contactLimiter } = require('../middlewares/V1/throttleMiddleware');

const router = express.Router();

router.post('/contact', contactLimiter, contact);

module.exports = router;
