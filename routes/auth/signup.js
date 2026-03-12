const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const { hashPassword, generateOTP } = require('../../utils/auth');
const { sendOTP } = require('../../utils/emailService');
const { validateSignup } = require('../../utils/validation');
const { authLimiter } = require('../../utils/rateLimiter');

router.post('/signup', authLimiter, validateSignup, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await hashPassword(password);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpiry,
      emailVerified: false
    });

    await user.save();

    // Send OTP email
    await sendOTP(email, otp);

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
