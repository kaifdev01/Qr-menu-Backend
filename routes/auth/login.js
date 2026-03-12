const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const { comparePassword, generateToken } = require('../../utils/auth');
const { validateLogin } = require('../../utils/validation');
const { loginLimiter } = require('../../utils/rateLimiter');

router.post('/login', loginLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.emailVerified) {
      return res.status(400).json({ success: false, message: 'Please verify your email first' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        hasCompletedOnboarding: user.hasCompletedOnboarding || false
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
