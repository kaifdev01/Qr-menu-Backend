const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const { generateOTP } = require('../../utils/auth');
const { sendOTP } = require('../../utils/emailService');
const { body, validationResult } = require('express-validator');
const { otpLimiter } = require('../../utils/rateLimiter');

const validateEmail = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }
    next();
  }
];

router.post('/resend-otp', otpLimiter, validateEmail, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOTP(email, otp);

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
