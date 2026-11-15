'use strict';
const { status, } = require("http-status");
const { testSendEmail, } = require("../../services/email");
const asyncHandler = require("express-async-handler");

const sendEmailRoute = asyncHandler(async (req, res) => {
  const sendEmail = await testSendEmail({
    subject: "Test Email ✔",
    message: "This is a test email sent during development.",
  });
  if (false === sendEmail) {
    res.status(status.INTERNAL_SERVER_ERROR);
    throw new Error(
      "Error encountered when attempting to send email.",
    );
  }

  res.status(status.OK);
  return res.json({
    message: "Message Sent.",
  });
});

module.exports = { sendEmailRoute };