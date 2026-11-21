"use strict";
const express = require("express");
const { authenticate, } = require("../../../../middlewares/V1/authMiddleware");
const { loginUser, authoriseUser, logoutUser, updateUser, } = require("../../../../controllers/API/V1/web/userControllers");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
router.route("/").post(loginLimiter, loginUser)
  .delete(authenticate, logoutUser)
  .put(authenticate, updateUser);
router.route("/authorise").get(authenticate, authoriseUser);

module.exports = router;