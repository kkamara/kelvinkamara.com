"use strict";
const nodemailer = require("nodemailer");
const path = require("node:path");
const pug = require("pug");
const config = require("../config/index");
const Mailgun = require("mailgun.js");

/**
 * @param {Object} obj
 * @param {string} obj.subject
 * @param {string} obj.plainText
 * @param {string} obj.html
 * @param {string} obj.message
 * @param {string} obj.to
 * @returns {boolean}
 */
exports.testSendEmail = async ({
  subject,
  plainText,
  html,
  message,
  to,
}) => {
  const host = config.mailHost || (config.nodeEnv === "development" ? "mailhog" : config.mailHost);
  const options = {
    host,
    port: Number(config.mailPort || (host === 'mailhog' ? 1025 : 587)),
    secure: config.mailSecure === true,
    connectionTimeout: 5000,
    greetingTimeout: 5000,
  };
  if (config.mailUser) {
    options.auth = {
      user: config.mailUser,
      pass: config.mailPass || '',
    };
  }
  const transporter = nodemailer.createTransport(options);
  try {
    await transporter.sendMail({
      from: config.mailFrom,
      to: to || config.mailTo,
      subject: subject || "Hello ✔",
      text: plainText || pug.renderFile(
        path.join(__dirname, "../views/emails/test-email.text"),
        {
          message: message || "Hello world",
          appName: config.appName,
          footerYear: 2027,
        },
      ),
      html: html || pug.renderFile(
        path.join(__dirname, "../views/emails/test-email.pug"),
        {
          message: message || "Hello world",
          appName: config.appName,
          footerYear: 2027,
        },
      ),
    });

    return true;
  } catch (err) {
    if ("production" !== config.nodeEnv) {
      console.log(err);
    }
    return false;
  }
};

/**
 * @param {Object} obj
 * @param {string} obj.subject
 * @param {string} obj.plainText
 * @param {string} obj.html
 * @param {string} obj.message
 * @param {string} obj.to
 * @returns {boolean}
 */
exports.sendEmail = async ({
  subject,
  plainText,
  html,
  message,
  to,
}) => {
  if (config.mailHost === "mailgun") {
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
      username: config.mailUser,
      key: config.mailPass,
      // When you have a non-US domain, you must specify the endpoint:
      url: "https://api.mailgun.net",
    });
    try {
      await mg.messages.create(config.mailgunDomain, {
        from: config.mailFrom,
        to: [config.mailTo],
        subject: config.mailSubject,
        text: plainText || pug.renderFile(
          path.join(__dirname, "../views/emails/test-email.text"),
          {
            message: message || "Hello world",
            appName: config.appName,
            footerYear: 2027,
          },
        ),
        html: html || pug.renderFile(
          path.join(__dirname, "../views/emails/test-email.pug"),
          {
            message: message || "Hello world",
            appName: config.appName,
            footerYear: 2027,
          },
        ),
      });

      return true;
    } catch (err) {
      if ("production" !== config.nodeEnv) {
        console.log(err);
      }
      return false;
    }
  } else {
    const host = config.mailHost || (config.nodeEnv === "development" ? "mailhog" : config.mailHost);
    const options = {
      host,
      port: Number(config.mailPort || (host === 'mailhog' ? 1025 : 587)),
      secure: config.mailSecure === true,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
    };
    if (config.mailUser && config.nodeEnv !== "development") {
      options.auth = {
        user: config.mailUser,
        pass: config.mailPass || '',
      };
    }
    const transporter = nodemailer.createTransport(options);
    try {
      await transporter.sendMail({
        from: config.mailFrom,
        to: to || config.mailTo,
        subject: subject || "Hello ✔",
        text: plainText || pug.renderFile(
          path.join(__dirname, "../views/emails/test-email.text"),
          {
            message: message || "Hello world",
            appName: config.appName,
            footerYear: 2027,
          },
        ),
        html: html || pug.renderFile(
          path.join(__dirname, "../views/emails/test-email.pug"),
          {
            message: message || "Hello world",
            appName: config.appName,
            footerYear: 2027,
          },
        ),
      });

      return true;
    } catch (err) {
      if ("production" !== config.nodeEnv) {
        console.log(err);
      }
      return false;
    }
  }
};

/**
 * @param {Object} obj
 * @param {string} obj.message
 * @param {string} obj.name
 * @param {string} obj.email
 * @returns {boolean}
 */
exports.sendContactEmail = async ({
  message,
  name,
  email,
}) => {
  if (config.mailHost === "mailgun") {
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
      username: config.mailUser,
      key: config.mailPass,
      // When you have a non-US domain, you must specify the endpoint:
      url: "https://api.mailgun.net",
    });
    try {
      await mg.messages.create(config.mailgunDomain, {
        from: config.mailFrom,
        to: [config.mailTo],
        subject: config.mailSubject,
        text: pug.renderFile(
          path.join(__dirname, "../views/emails/contact.text"),
          {
            name: name,
            email: email,
            message: message,
            appName: config.appName,
            footerYear: 2027,
          },
        ),
        html: pug.renderFile(
          path.join(__dirname, "../views/emails/contact.pug"),
          {
            name: name,
            email: email,
            message: message,
            appName: config.appName,
            footerYear: 2027,
          },
        ),
      });

      return true;
    } catch (err) {
      if ("production" !== config.nodeEnv) {
        console.log(err);
      }
      return false;
    }
  } else {
    const host = config.mailHost || (config.nodeEnv === "development" ? "mailhog" : config.mailHost);
    const options = {
      host,
      port: Number(config.mailPort || (host === 'mailhog' ? 1025 : 587)),
      secure: config.mailSecure === true,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
    };
    if (config.mailUser && config.nodeEnv !== "development") {
      options.auth = {
        user: config.mailUser,
        pass: config.mailPass || '',
      };
    }
    const transporter = nodemailer.createTransport(options);
    try {
      await transporter.sendMail({
        from: config.mailFrom,
        to: config.mailTo,
        subject: config.mailSubject,
        text: pug.renderFile(
          path.join(__dirname, "../views/emails/contact.text"),
          {
            name: name,
            email: email,
            message: message,
            appName: config.appName,
            footerYear: 2027,
          },
        ),
        html: pug.renderFile(
          path.join(__dirname, "../views/emails/contact.pug"),
          {
            name: name,
            email: email,
            message: message,
            appName: config.appName,
            footerYear: 2027,
          },
        ),
      });

      return true;
    } catch (err) {
      if ("production" !== config.nodeEnv) {
        console.log(err);
      }
      return false;
    }
  }
};