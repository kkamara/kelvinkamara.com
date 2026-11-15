'use strict';
const { validateEmail } = require('./validators');

const validateContactForm = (name, email, message) => {
  if (!name) {
    return { valid: false, error: 'Name string must be provided' };
  }

  if (name.length < 3) {
    return { valid: false, error: 'Name length must be greater than 2 characters' };
  }

  if (name.length > 50) {
    return { valid: false, error: 'Name length must be less than 51 characters' };
  }

  if (!email) {
    return { valid: false, error: 'Email string must be provided' };
  }

  if (email.length < 3) {
    return { valid: false, error: 'Email length must be greater than 2 characters' };
  }

  if (email.length > 100) {
    return { valid: false, error: 'Email length must be less than 101 characters' };
  }

  if (!validateEmail(email)) {
    return { valid: false, error: 'Email must be a valid format like johnsmith@example.com' };
  }

  if (message && message.length > 1000) {
    return { valid: false, error: 'Message length must be less than 1001 characters' };
  }

  return { valid: true };
};

module.exports = {
  validateContactForm,
  validateEmail,
};
