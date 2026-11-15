'use strict';
const express = require('express');
const { health } = require('../../controllers/API/healthControllers');
const { sendEmailRoute } = require('../../controllers/API/emailControllers');
const contactRoutes = require('./contactRoutes');

const router = express.Router();

router.route("/health").get(health);
router.route("/email").get(sendEmailRoute);
router.use('/', contactRoutes);

module.exports = router;
