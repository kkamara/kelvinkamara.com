'use strict';
const express = require('express');
const homeRoutes = require('./homeRoutes');
const apiRoutes = require('./API');

const router = express.Router();

router.use('/api', apiRoutes);
router.use('/', homeRoutes);

module.exports = router;
