'use strict';
const { status, } = require("http-status");
const { sendContactEmail, } = require("../../services/mailService");
const asyncHandler = require("express-async-handler");

const sendEmailRoute = asyncHandler(async (req, res) => {
  await sendContactEmail({
    name: "Test User",
    email: "test@example.com",
    message: "This is a test email sent during development.",
    appUrl: process.env.APP_URL || "https://kelvinkamara.com",
  });

  res.status(status.OK);
  return res.json({
    message: "Message Sent.",
  });
});

module.exports = { sendEmailRoute };

