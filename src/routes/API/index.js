'use strict';
const express = require('express');
const contactRoutes = require('./contactRoutes');

const router = express.Router();

router.use('/', contactRoutes);

module.exports = router;
