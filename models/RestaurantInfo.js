const mongoose = require('mongoose');

const restaurantInfoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  phone: { type: String, required: true },
  openTime: { type: String, required: true },
  closeTime: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.RestaurantInfo || mongoose.model('RestaurantInfo', restaurantInfoSchema);
