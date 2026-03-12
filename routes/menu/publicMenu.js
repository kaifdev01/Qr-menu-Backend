const express = require('express');
const router = express.Router();
const Menu = require('../../models/Menu');
const MenuItem = require('../../models/MenuItem');

router.get('/:uniqueUrl', async (req, res) => {
  try {
    const menu = await Menu.findOne({ uniqueUrl: req.params.uniqueUrl, isActive: true }).populate('userId');
    
    if (!menu) {
      return res.status(404).json({ success: false, message: 'Menu not found' });
    }

    const items = await MenuItem.find({ menuId: menu._id, isAvailable: true }).sort({ category: 1, name: 1 });
    const RestaurantInfo = require('../../models/RestaurantInfo');
    const restaurantInfo = await RestaurantInfo.findOne({ userId: menu.userId });

    // Log customization for debugging
    console.log('Menu customization:', menu.customization);

    res.json({
      success: true,
      menu: {
        name: menu.name,
        description: menu.description,
        restaurantName: menu.restaurantName,
        customization: menu.customization || {},
        items
      },
      restaurant: restaurantInfo ? {
        location: restaurantInfo.location,
        phone: restaurantInfo.phone,
        openTime: restaurantInfo.openTime,
        closeTime: restaurantInfo.closeTime
      } : null
    });
  } catch (error) {
    console.error('Get public menu error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
