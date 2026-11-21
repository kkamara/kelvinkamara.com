'use strict';
const path = require('node:path');
const cookieParser = require('cookie-parser');
const sanitize = require('sanitize');
const express = require('express');
const config = require('./config');
const routes = require('./routes');
const { notFound, jsonError } = require('./middlewares/V1/errorMiddleware');
const { session } = require('./middlewares/V1/sessionMiddleware');
const { minifyHTML } = require('./middlewares/V1/minifyHTMLMiddleware');
const { requestLog } = require('./middlewares/V1/loggingMiddleware');
const { limiter } = require('./middlewares/V1/throttleMiddleware');
const { cors } = require('./middlewares/V1/corsMiddleware');
const agreementJson = require('./middlewares/V1/agreementJsonMiddleware');

const app = express();
const adminDist = process.env.ADMIN_DIST_PATH || path.join(__dirname, '../frontend/dist');

// Trust proxy in production
if (config.nodeEnv === 'production') {
  app.enable('trust proxy');
}

// Apply rate limiting
app.use(limiter);

// Request logging
app.use(requestLog);

// View engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/admin/assets', express.static(path.join(adminDist, 'assets'), { fallthrough: false }));
app.use('/admin', express.static(adminDist, { index: false, redirect: false }));

// HTML minification in production
if (config.nodeEnv === 'production') {
  app.use(minifyHTML);
}

// Session and cookie handling
app.use(session);
app.use(cookieParser(config.appKey));

// Body parsing
app.use(express.urlencoded({ extended: false }));
app.use(['/api/v1/web/admin/agreements', '/api/v1/web/admin/agreement-templates'], agreementJson);
app.use(express.json());

// Security middleware
app.use(sanitize.middleware);
app.use(cors);

// Routes
app.use('/', routes);

// Serve React app routes
app.get(["/admin", "/admin/*"], (req, res) => {
  res.sendFile(path.join(adminDist, "index.html"));
});

// Error handling
app.use(notFound);
app.use(jsonError);

// Start server
const PORT = config.appPort || 8000;

if (config.nodeEnv === 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    const url = `http://127.0.0.1:${PORT}`;
    console.log(`Server running at ${url}`);
  });
}

module.exports = app;
