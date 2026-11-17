'use strict';
const config = require('../config');
const asyncHandler = require('express-async-handler');
const axios = require('axios');
const { status } = require('http-status');
const { sendContactEmail } = require('../services/email');
const { message500 } = require('../utils/httpResponses');
const contactValidator = require('../utils/contactValidator');

const verifyTurnstile = async (captchaToken) => {
  if (!config.turnstileSecret) {
    throw new Error('TURNSTILE_SECRET not configured');
  }

  try {
    const response = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        secret: config.turnstileSecret,
        response: captchaToken,
      },
      { timeout: 10000 }
    );

    return response.data;
  } catch (error) {
    console.error('Turnstile verification failed:', error.message);
    throw new Error('CAPTCHA verification failed');
  }
};

const contact = asyncHandler(async (req, res) => {
  const name = req.bodyString("name");
  const email = req.bodyString("email");
  const message = req.bodyString("message");
  const captchaToken = req.body['cf-turnstile-response'] || '';

  // CAPTCHA verification
  if (config.turnstileSitekey && config.turnstileSecret) {
    if (!captchaToken) {
      res.status(status.BAD_REQUEST);
      throw new Error("Captcha is required before submitting.");
    }

    try {
      const captchaResult = await verifyTurnstile(captchaToken);

      if (!captchaResult.success) {
        res.status(status.BAD_REQUEST);
        throw new Error("Captcha verification failed. Please try again.");
      }

      // Validate hostname for non-production environments
      if (config.nodeEnv === 'local' || config.nodeEnv === 'development') {
        const hostname = captchaResult.hostname || '';
        if (hostname && !hostname.includes('localhost') && hostname !== 'example.com') {
          console.warn('Hostname mismatch in CAPTCHA:', hostname);
        }
      }
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR)
      throw new Error(message500);
    }
  }

  // Validate input using contact validator
  const validation = contactValidator.validateContactForm(name, email, message);
  if (!validation.valid) {
    return res.status(status.BAD_REQUEST).json({
      error: validation.error,
    });
  }

  const sendEmail = await sendContactEmail({
    name,
    email,
    message,
  });

  if (false === sendEmail) {
    res.status(status.INTERNAL_SERVER_ERROR);
    throw new Error(
      "Error encountered when attempting to send email.",
    );
  }

  return res.json({ message: 'Success' });
});


const sitemap = asyncHandler(async (req, res) => {
  res.type('application/xml');
  res.sendFile(require('path').join(__dirname, '../../public/sitemap.xml'));
});

const robots = asyncHandler(async (req, res) => {
  res.type('text/plain');
  res.sendFile(require('path').join(__dirname, '../../public/robots.txt'));
});

module.exports = {
  contact,
  sitemap,
  robots,
};
