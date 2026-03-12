const express = require('express');
const router = express.Router();
const Menu = require('../../models/Menu');
const MenuItem = require('../../models/MenuItem');
const Subscription = require('../../models/Subscription');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const crypto = require('crypto');

// Auth middleware
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

// Check subscription limits
const checkSubscriptionLimits = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.userId });
    
    if (!subscription || subscription.status === 'expired') {
      return res.status(403).json({ success: false, message: 'No active subscription' });
    }

    const menuCount = await Menu.countDocuments({ userId: req.userId });
    
    if (subscription.planId === 'trial' && menuCount >= 1) {
      return res.status(403).json({ 
        success: false, 
        message: 'Trial plan allows only 1 menu. Please upgrade.' 
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create menu
router.post('/create', authenticateToken, checkSubscriptionLimits, async (req, res) => {
  try {
    const { name, description, restaurantName } = req.body;

    if (!name || !restaurantName) {
      return res.status(400).json({ success: false, message: 'Name and restaurant name are required' });
    }

    const uniqueUrl = crypto.randomBytes(8).toString('hex');
    const menuUrl = `${process.env.FRONTEND_URL}/menu/${uniqueUrl}`;

    const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' }
    });

    const menu = new Menu({
      userId: req.userId,
      name,
      description,
      restaurantName,
      uniqueUrl,
      qrCodeUrl: qrCodeDataUrl
    });

    await menu.save();

    res.json({
      success: true,
      message: 'Menu created successfully',
      menu: {
        id: menu._id,
        name: menu.name,
        description: menu.description,
        restaurantName: menu.restaurantName,
        uniqueUrl: menu.uniqueUrl,
        qrCodeUrl: menu.qrCodeUrl,
        menuUrl
      }
    });
  } catch (error) {
    console.error('Create menu error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all user menus
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const menus = await Menu.find({ userId: req.userId }).sort({ createdAt: -1 });
    
    const menusWithItemCount = await Promise.all(
      menus.map(async (menu) => {
        const itemCount = await MenuItem.countDocuments({ menuId: menu._id });
        return {
          id: menu._id,
          _id: menu._id,
          name: menu.name,
          description: menu.description,
          restaurantName: menu.restaurantName,
          uniqueUrl: menu.uniqueUrl,
          qrCodeUrl: menu.qrCodeUrl,
          isActive: menu.isActive,
          itemCount,
          createdAt: menu.createdAt
        };
      })
    );

    res.json({ success: true, menus: menusWithItemCount });
  } catch (error) {
    console.error('Get menus error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single menu
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const menu = await Menu.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!menu) {
      return res.status(404).json({ success: false, message: 'Menu not found' });
    }

    const items = await MenuItem.find({ menuId: menu._id }).sort({ category: 1, name: 1 });

    res.json({
      success: true,
      menu: {
        id: menu._id,
        name: menu.name,
        description: menu.description,
        restaurantName: menu.restaurantName,
        uniqueUrl: menu.uniqueUrl,
        qrCodeUrl: menu.qrCodeUrl,
        isActive: menu.isActive,
        customization: menu.customization,
        items
      }
    });
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update menu
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, restaurantName, isActive, customization } = req.body;
    
    const menu = await Menu.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!menu) {
      return res.status(404).json({ success: false, message: 'Menu not found' });
    }

    if (name) menu.name = name;
    if (description !== undefined) menu.description = description;
    if (restaurantName) menu.restaurantName = restaurantName;
    if (isActive !== undefined) menu.isActive = isActive;
    if (customization) menu.customization = customization;
    menu.updatedAt = Date.now();

    await menu.save();

    res.json({ success: true, message: 'Menu updated successfully', menu });
  } catch (error) {
    console.error('Update menu error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete menu
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const menu = await Menu.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!menu) {
      return res.status(404).json({ success: false, message: 'Menu not found' });
    }

    await MenuItem.deleteMany({ menuId: menu._id });
    await Menu.deleteOne({ _id: menu._id });

    res.json({ success: true, message: 'Menu deleted successfully' });
  } catch (error) {
    console.error('Delete menu error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add menu item
router.post('/:id/items', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, category, image } = req.body;
    
    const menu = await Menu.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!menu) {
      return res.status(404).json({ success: false, message: 'Menu not found' });
    }

    const subscription = await Subscription.findOne({ userId: req.userId });
    const itemCount = await MenuItem.countDocuments({ menuId: menu._id });
    
    if (subscription.planId === 'trial' && itemCount >= 20) {
      return res.status(403).json({ 
        success: false, 
        message: 'Trial plan allows only 20 items. Please upgrade.' 
      });
    }

    const menuItem = new MenuItem({
      menuId: menu._id,
      name,
      description,
      price,
      category: category || 'Other',
      image
    });

    await menuItem.save();

    res.json({ success: true, message: 'Item added successfully', item: menuItem });
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update menu item
router.put('/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, category, image, isAvailable } = req.body;
    
    const item = await MenuItem.findById(req.params.itemId);
    
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const menu = await Menu.findOne({ _id: item.menuId, userId: req.userId });
    
    if (!menu) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (name) item.name = name;
    if (description !== undefined) item.description = description;
    if (price) item.price = price;
    if (category) item.category = category;
    if (image !== undefined) item.image = image;
    if (isAvailable !== undefined) item.isAvailable = isAvailable;

    await item.save();

    res.json({ success: true, message: 'Item updated successfully', item });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete menu item
router.delete('/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.itemId);
    
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const menu = await Menu.findOne({ _id: item.menuId, userId: req.userId });
    
    if (!menu) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await MenuItem.deleteOne({ _id: item._id });

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk add items
router.post('/:id/bulk-add', authenticateToken, async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items array is required' });
    }

    const menu = await Menu.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!menu) {
      return res.status(404).json({ success: false, message: 'Menu not found' });
    }

    const subscription = await Subscription.findOne({ userId: req.userId });
    const currentItemCount = await MenuItem.countDocuments({ menuId: menu._id });
    
    if (subscription.planId === 'trial' && currentItemCount + items.length > 20) {
      return res.status(403).json({ 
        success: false, 
        message: `Trial plan allows only 20 items total. You have ${currentItemCount}, trying to add ${items.length}.` 
      });
    }

    const menuItems = items.map(item => ({
      menuId: menu._id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category || 'Other',
      image: item.image || ''
    }));

    const savedItems = await MenuItem.insertMany(menuItems);

    res.json({ 
      success: true, 
      message: `Added ${savedItems.length} items successfully`,
      items: savedItems 
    });
  } catch (error) {
    console.error('Bulk add error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk delete items
router.post('/bulk-delete', authenticateToken, async (req, res) => {
  try {
    const { itemIds } = req.body;
    
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Item IDs array is required' });
    }

    // Verify all items belong to user's menus
    const items = await MenuItem.find({ _id: { $in: itemIds } });
    const menuIds = [...new Set(items.map(item => item.menuId.toString()))];
    
    const menus = await Menu.find({ _id: { $in: menuIds }, userId: req.userId });
    
    if (menus.length !== menuIds.length) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const result = await MenuItem.deleteMany({ _id: { $in: itemIds } });

    res.json({ 
      success: true, 
      message: `Deleted ${result.deletedCount} items successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Duplicate menu
router.post('/:id/duplicate', authenticateToken, checkSubscriptionLimits, async (req, res) => {
  try {
    const { name } = req.body;
    const sourceMenu = await Menu.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!sourceMenu) {
      return res.status(404).json({ success: false, message: 'Menu not found' });
    }

    const uniqueUrl = crypto.randomBytes(8).toString('hex');
    const menuUrl = `${process.env.FRONTEND_URL}/menu/${uniqueUrl}`;

    const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' }
    });

    const newMenu = new Menu({
      userId: req.userId,
      name: name || `${sourceMenu.name} - Copy`,
      description: sourceMenu.description,
      restaurantName: sourceMenu.restaurantName,
      uniqueUrl,
      qrCodeUrl: qrCodeDataUrl,
      isActive: false
    });

    await newMenu.save();

    // Copy all items
    const sourceItems = await MenuItem.find({ menuId: sourceMenu._id });
    if (sourceItems.length > 0) {
      const copiedItems = sourceItems.map(item => ({
        menuId: newMenu._id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image,
        isAvailable: item.isAvailable
      }));
      await MenuItem.insertMany(copiedItems);
    }

    res.json({
      success: true,
      message: 'Menu duplicated successfully',
      menu: {
        id: newMenu._id,
        name: newMenu.name,
        description: newMenu.description,
        restaurantName: newMenu.restaurantName,
        uniqueUrl: newMenu.uniqueUrl,
        qrCodeUrl: newMenu.qrCodeUrl,
        itemCount: sourceItems.length
      }
    });
  } catch (error) {
    console.error('Duplicate menu error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
