const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: String, required: true },
  planName: String,
  status: { type: String, enum: ['trial', 'active', 'cancelled', 'expired'], default: 'trial' },
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  trialEndsAt: Date,
  autoRenew: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
