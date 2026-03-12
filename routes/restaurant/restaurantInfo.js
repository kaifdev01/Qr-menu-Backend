const express = require('express');
const router = express.Router();
const RestaurantInfo = require('../../models/RestaurantInfo');
const User = require('../../models/User');
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

router.post('/setup', authenticateToken, async (req, res) => {
  try {
    const { name, location, phone, openTime, closeTime } = req.body;

    let restaurantInfo = await RestaurantInfo.findOne({ userId: req.userId });

    if (restaurantInfo) {
      restaurantInfo.name = name;
      restaurantInfo.location = location;
      restaurantInfo.phone = phone;
      restaurantInfo.openTime = openTime;
      restaurantInfo.closeTime = closeTime;
      await restaurantInfo.save();
    } else {
      restaurantInfo = new RestaurantInfo({
        userId: req.userId,
        name,
        location,
        phone,
        openTime,
        closeTime
      });
      await restaurantInfo.save();
    }

    await User.findByIdAndUpdate(req.userId, { restaurantSetup: true });

    res.json({ success: true, message: 'Restaurant setup complete' });
  } catch (error) {
    console.error('Restaurant setup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/info', authenticateToken, async (req, res) => {
  try {
    const restaurantInfo = await RestaurantInfo.findOne({ userId: req.userId });
    
    if (!restaurantInfo) {
      return res.status(404).json({ success: false, message: 'Restaurant info not found' });
    }

    res.json({ success: true, restaurant: restaurantInfo });
  } catch (error) {
    console.error('Get restaurant info error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
