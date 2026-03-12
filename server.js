const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:admin@cluster0.lt8pl7j.mongodb.net/';
mongoose.connect(MONGODB_URI);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Routes
const restaurantRoutes = require('./routes/restaurants');
app.use('/api/restaurants', restaurantRoutes);

// Auth Routes
const signupRoute = require('./routes/auth/signup');
const loginRoute = require('./routes/auth/login');
const verifyOtpRoute = require('./routes/auth/verifyOtp');
const resendOtpRoute = require('./routes/auth/resendOtp');
const googleSigninRoute = require('./routes/auth/googleSignin');

app.use('/api/auth', signupRoute);
app.use('/api/auth', loginRoute);
app.use('/api/auth', verifyOtpRoute);
app.use('/api/auth', resendOtpRoute);
app.use('/api/auth', googleSigninRoute);

// Subscription Routes
const selectPlanRoute = require('./routes/subscription/selectPlan');
const subscriptionDetailsRoute = require('./routes/subscription/subscriptionDetails');
app.use('/api/subscription', selectPlanRoute);
app.use('/api/subscription', subscriptionDetailsRoute);

// Menu Routes
const menuRoutes = require('./routes/menu/menuRoutes');
const uploadImageRoute = require('./routes/menu/uploadImage');
const publicMenuRoute = require('./routes/menu/publicMenu');
app.use('/api/menu', menuRoutes);
app.use('/api/upload', uploadImageRoute);
app.use('/api/public/menu', publicMenuRoute);

// Restaurant Routes
const restaurantInfoRoute = require('./routes/restaurant/restaurantInfo');
app.use('/api/restaurant', restaurantInfoRoute);

// User Routes
const userProfileRoute = require('./routes/user/userProfile');
app.use('/api/user', userProfileRoute);

app.get('/', (req, res) => {
    res.json({ message: 'QR Menu Generator API' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});