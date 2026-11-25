'use strict';
const express = require('express');
const userRoutes = require("./userRoutes");
const adminRoutes = require("./adminRoutes");
const subscriptionRoutes = require("./subscriptionRoutes");

const router = express.Router();

router.use("/user", userRoutes);
router.use("/admin", adminRoutes);
router.use("/subscriptions", subscriptionRoutes);

module.exports = router;