const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  restaurantName: { type: String, required: true },
  qrCodeUrl: String,
  uniqueUrl: { type: String, unique: true, required: true },
  isActive: { type: Boolean, default: true },
  
  // Customization fields
  customization: {
    logo: {
      url: String,
      uploadedAt: Date
    },
    theme: {
      template: { 
        type: String, 
        enum: ['modern', 'classic', 'minimal', 'elegant', 'vibrant'],
        default: 'modern'
      },
      // Old format (for backward compatibility)
      primaryColor: String,
      secondaryColor: String,
      textColor: String,
      accentColor: String,
      backgroundColor: String,
      // New format (detailed colors)
      topBarBgColor: String,
      topBarSecondaryColor: String,
      headingColor: String,
      bodyTextColor: String,
      itemBgColor: String,
      itemBorderColor: String,
      categoryActiveBgColor: String,
      categoryActiveTextColor: String,
      categoryInactiveBgColor: String,
      categoryInactiveTextColor: String
    },
    fonts: {
      heading: { 
        type: String, 
        enum: ['inter', 'poppins', 'playfair', 'montserrat', 'roboto', 'lora', 'opensans', 'merriweather', 'raleway', 'nunito', 'crimson'],
        default: 'inter'
      },
      body: { 
        type: String, 
        enum: ['inter', 'poppins', 'playfair', 'montserrat', 'roboto', 'lora', 'opensans', 'merriweather', 'raleway', 'nunito', 'crimson'],
        default: 'inter'
      }
    },
    branding: {
      showLogo: { type: Boolean, default: true },
      showRestaurantName: { type: Boolean, default: true },
      showDescription: { type: Boolean, default: true },
      footerText: String
    }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Menu || mongoose.model('Menu', menuSchema);
