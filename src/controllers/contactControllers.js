'use strict';
const config = require('../../config');
const asyncHandler = require('express-async-handler');
const axios = require('axios');
const { status } = require('http-status');
const mailService = require('../../services/mailService');

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
  const { name, email, message } = req.body;
  const captchaToken = req.body['cf-turnstile-response'] || '';

  // CAPTCHA verification
  if (config.turnstileSitekey && config.turnstileSecret) {
    if (!captchaToken) {
      return res.status(status.BAD_REQUEST).json({
        error: 'Captcha is required before submitting.',
      });
    }

    try {
      const captchaResult = await verifyTurnstile(captchaToken);

      if (!captchaResult.success) {
        return res.status(status.BAD_REQUEST).json({
          error: 'Captcha verification failed. Please try again.',
        });
      }

      // Validate hostname for non-production environments
      if (config.nodeEnv === 'local' || config.nodeEnv === 'development') {
        const hostname = captchaResult.hostname || '';
        if (hostname && !hostname.includes('localhost') && hostname !== 'example.com') {
          console.warn('Hostname mismatch in CAPTCHA:', hostname);
        }
      }
    } catch (error) {
      console.error('CAPTCHA verification error:', error.message);
      return res.status(status.INTERNAL_SERVER_ERROR).json({
        error: 'Internal Server Error.',
      });
    }
  }

  // Validate input using contact validator
  const contactValidator = require('../../utils/contactValidator');
  const validation = contactValidator.validateContactForm(name, email, message);
  if (!validation.valid) {
    return res.status(status.BAD_REQUEST).json({
      error: validation.error,
    });
  }

  // Send email
  try {
    await mailService.sendContactEmail({
      name,
      email,
      message,
      appUrl: config.appURL,
    });

    return res.status(status.OK).json({
      message: 'Success',
    });
  } catch (error) {
    console.error('Email send failed:', error.message);
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      error: 'Internal Server Error.',
    });
  }
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
