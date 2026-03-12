const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const { generateToken, hashPassword } = require('../../utils/auth');
const { validateGoogleSignin } = require('../../utils/validation');
const { authLimiter } = require('../../utils/rateLimiter');
const crypto = require('crypto');

router.post('/google-signin', authLimiter, validateGoogleSignin, async (req, res) => {
  try {
    const { email, name, googleId, image } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      // Create new user with secure random password
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await hashPassword(randomPassword);
      
      user = new User({
        name,
        email,
        password: hashedPassword,
        emailVerified: true,
        googleId,
        image
      });
      await user.save();
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleId;
      user.emailVerified = true;
      user.image = image;
      await user.save();
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        image: user.image,
        hasCompletedOnboarding: user.hasCompletedOnboarding || false
      }
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
