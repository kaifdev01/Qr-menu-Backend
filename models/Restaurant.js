const mongoose = require('mongoose');

const restaurantMenuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    default: null
  },
  available: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  logo: {
    type: String,
    default: null
  },
  qrCode: {
    type: String,
    default: null
  },
  menuItems: [restaurantMenuItemSchema]
}, {
  timestamps: true
});

module.exports = mongoose.models.Restaurant || mongoose.model('Restaurant', restaurantSchema);