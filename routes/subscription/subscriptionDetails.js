const express = require('express');
const router = express.Router();
const Subscription = require('../../models/Subscription');
const jwt = require('jsonwebtoken');

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

router.get('/details', authenticateToken, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.userId });
    
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'No subscription found' });
    }

    res.json({ success: true, subscription });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
