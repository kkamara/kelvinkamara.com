const { Subscription, User } = require('../../models/V1');
const { nodeEnv } = require('../../config');

/**
 * Add a new subscription for a client
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.addSubscription = async (req, res) => {
  try {
    const { userId, serviceName } = req.body;

    // Validate input
    if (!userId || !serviceName) {
      return res.status(400).json({
        success: false,
        message: 'userId and serviceName are required',
      });
    }

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Create subscription
    const subscription = await Subscription.create({
      userId,
      serviceName: serviceName.trim(),
      startDate: new Date(),
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Subscription added successfully',
      data: subscription,
    });
  } catch (error) {
    if ('production' !== nodeEnv) {
      console.error('Error adding subscription:', error);
    }
    return res.status(500).json({
      success: false,
      message: 'Error adding subscription',
    });
  }
};

/**
 * Get all active subscriptions for a client
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getActiveSubscriptions = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Fetch active subscriptions
    const subscriptions = await Subscription.findAll({
      where: {
        userId,
        isActive: true,
      },
      order: [['startDate', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    if ('production' !== nodeEnv) {
      console.error('Error fetching active subscriptions:', error);
    }
    return res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions',
    });
  }
};

/**
 * Get all subscriptions (active and inactive) for a client
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllSubscriptions = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Fetch all subscriptions (including soft-deleted)
    const subscriptions = await Subscription.findAll({
      where: { userId },
      order: [['startDate', 'DESC']],
      paranoid: false, // Include soft-deleted records
    });

    return res.status(200).json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    if ('production' !== nodeEnv) {
      console.error('Error fetching all subscriptions:', error);
    }
    return res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions',
    });
  }
};

/**
 * End a subscription (mark as inactive)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.endSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    // Find subscription
    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    if (!subscription.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Subscription is already inactive',
      });
    }

    // Update subscription
    await subscription.update({
      isActive: false,
      endDate: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: 'Subscription ended successfully',
      data: subscription,
    });
  } catch (error) {
    if ('production' !== nodeEnv) {
      console.error('Error ending subscription:', error);
    }
    return res.status(500).json({
      success: false,
      message: 'Error ending subscription',
    });
  }
};

/**
 * Reactivate a subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.reactivateSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    // Find subscription
    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    if (subscription.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Subscription is already active',
      });
    }

    // Update subscription
    await subscription.update({
      isActive: true,
      endDate: null,
    });

    return res.status(200).json({
      success: true,
      message: 'Subscription reactivated successfully',
      data: subscription,
    });
  } catch (error) {
    if ('production' !== nodeEnv) {
      console.error('Error reactivating subscription:', error);
    }
    return res.status(500).json({
      success: false,
      message: 'Error reactivating subscription',
    });
  }
};

/**
 * Delete a subscription permanently
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    // Find subscription
    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    // Soft delete subscription
    await subscription.destroy();

    return res.status(200).json({
      success: true,
      message: 'Subscription deleted successfully',
    });
  } catch (error) {
    if ('production' !== nodeEnv) {
      console.error('Error deleting subscription:', error);
    }
    return res.status(500).json({
      success: false,
      message: 'Error deleting subscription',
    });
  }
};

/**
 * Get active service names for a client
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getActiveServices = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Fetch distinct active service names
    const services = await Subscription.findAll({
      attributes: ['serviceName'],
      where: {
        userId,
        isActive: true,
      },
      raw: true,
      group: ['serviceName'],
      order: [['serviceName', 'ASC']],
      subQuery: false,
    });

    const serviceNames = services.map((s) => s.serviceName);

    return res.status(200).json({
      success: true,
      count: serviceNames.length,
      data: serviceNames,
    });
  } catch (error) {
    if ('production' !== nodeEnv) {
      console.error('Error fetching active services:', error);
    }
    return res.status(500).json({
      success: false,
      message: 'Error fetching services',
    });
  }
};

/**
 * Check if a client has an active subscription to a specific service
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.checkServiceSubscription = async (req, res) => {
  try {
    const { userId, serviceName } = req.params;

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check subscription
    const subscription = await Subscription.findOne({
      where: {
        userId,
        serviceName: serviceName.trim(),
        isActive: true,
      },
    });

    return res.status(200).json({
      success: true,
      hasSubscription: !!subscription,
      data: subscription || null,
    });
  } catch (error) {
    if ('production' !== nodeEnv) {
      console.error('Error checking service subscription:', error);
    }
    return res.status(500).json({
      success: false,
      message: 'Error checking subscription',
    });
  }
};
