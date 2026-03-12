const express = require('express');
const router = express.Router();
const Subscription = require('../../models/Subscription');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    req.userId = user.userId;
    next();
  });
};

router.post('/select-plan', authenticateToken, async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.userId;

    // Check if user already has a subscription
    let subscription = await Subscription.findOne({ userId });

    const planDetails = {
      trial: { name: 'Free Trial', duration: 5 },
      starter: { name: 'Starter', duration: 30 },
      professional: { name: 'Professional', duration: 30 },
      enterprise: { name: 'Enterprise', duration: 30 }
    };

    const plan = planDetails[planId];
    if (!plan) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration);

    if (subscription) {
      // Update existing subscription
      subscription.planId = planId;
      subscription.planName = plan.name;
      subscription.status = planId === 'trial' ? 'trial' : 'active';
      subscription.startDate = startDate;
      subscription.endDate = endDate;
      if (planId === 'trial') {
        subscription.trialEndsAt = endDate;
      }
      await subscription.save();
    } else {
      // Create new subscription
      subscription = new Subscription({
        userId,
        planId,
        planName: plan.name,
        status: planId === 'trial' ? 'trial' : 'active',
        startDate,
        endDate,
        trialEndsAt: planId === 'trial' ? endDate : null
      });
      await subscription.save();
    }

    // Update user with subscription info
    await User.findByIdAndUpdate(userId, {
      hasCompletedOnboarding: true,
      subscriptionId: subscription._id
    });

    res.json({
      success: true,
      message: 'Plan selected successfully',
      subscription: {
        planId: subscription.planId,
        planName: subscription.planName,
        status: subscription.status,
        endDate: subscription.endDate
      }
    });
  } catch (error) {
    console.error('Select plan error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
