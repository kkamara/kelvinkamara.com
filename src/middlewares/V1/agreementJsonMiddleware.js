'use strict';
const express = require('express');

module.exports = express.json({ limit: '512kb' });
