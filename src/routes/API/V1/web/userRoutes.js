"use strict";
const express = require("express");
const { authenticate, } = require("../../../../middlewares/V1/authMiddleware");
const { createUser, loginUser, authoriseUser, logoutUser, updateUser, } = require("../../../../controllers/API/V1/web/userControllers");

const router = express.Router();

router.route("/register").post(createUser);
router.route("/").post(loginUser)
  .delete(authenticate, logoutUser)
  .put(authenticate, updateUser);
router.route("/authorise").get(authenticate, authoriseUser);

module.exports = router;