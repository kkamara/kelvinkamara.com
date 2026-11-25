'use strict';
const express = require('express');
const { authenticate } = require('../../../../middlewares/V1/authMiddleware');
const {
  addSubscription,
  getActiveSubscriptions,
  getAllSubscriptions,
  endSubscription,
  reactivateSubscription,
  deleteSubscription,
  getActiveServices,
  checkServiceSubscription,
} = require('../../../../controllers/API/V1/web/subscriptionControllers');

const router = express.Router();

// Add a new subscription for a client
router.post('/', authenticate, addSubscription);

// Get all active subscriptions for a client
router.get('/active/:userId', authenticate, getActiveSubscriptions);

// Get all subscriptions (including inactive) for a client
router.get('/all/:userId', authenticate, getAllSubscriptions);

// Get active service names for a client
router.get('/services/active/:userId', authenticate, getActiveServices);

// Check if client has subscription to a specific service
router.get('/check/:userId/:serviceName', authenticate, checkServiceSubscription);

// End a subscription (mark as inactive)
router.put('/:subscriptionId/end', authenticate, endSubscription);

// Reactivate an inactive subscription
router.put('/:subscriptionId/reactivate', authenticate, reactivateSubscription);

// Delete a subscription (soft delete)
router.delete('/:subscriptionId', authenticate, deleteSubscription);

module.exports = router;
