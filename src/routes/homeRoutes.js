'use strict';
const express = require('express');
const asyncHandler = require('express-async-handler');
const config = require('../config');

const router = express.Router();

const index = asyncHandler(async (req, res) => {
  return res.render('home', {
    title: 'Home',
    config: {
      appName: config.appName,
    },
    turnstile_sitekey: config.turnstileSitekey,
    csrfToken: req.csrfToken(),
  });
});

const sitemap = asyncHandler(async (req, res) => {
  res.type('application/xml');
  res.sendFile(require('path').join(__dirname, '../public/sitemap.xml'));
});

const robots = asyncHandler(async (req, res) => {
  res.type('text/plain');
  res.sendFile(require('path').join(__dirname, '../public/robots.txt'));
});

router.route('/').get(index);
router.route('/sitemap.xml').get(sitemap);
router.route('/robots.txt').get(robots);

module.exports = router;
