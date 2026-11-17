'use strict';
const rateLimit = require('express-rate-limit');
const config = require('../../config');

module.exports.limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: config.nodeEnv === 'production' ? 10000 : 100000,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  ipv6Subnet: 56,
  skip: (req) => {
    // Skip rate limiting for static files
    return req.path.startsWith('/assets') || req.path.startsWith('/public');
  },
});

module.exports.contactLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 5, // 5 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many contact form submissions. Please try again later.',
  skipSuccessfulRequests: false,
});
