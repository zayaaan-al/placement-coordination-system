const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const studentRoutes = require('./routes/students');
const trainerRoutes = require('./routes/trainers');
const jobRoutes = require('./routes/jobs');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const placementRequestRoutes = require('./routes/placementRequests');

const errorHandler = require('./middleware/errorHandler');
const User = require('./models/User');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const { apiLimiter, authLimiter, registrationLimiter } = require('./middleware/rateLimiter');

// Apply rate limiting to specific routes
app.use('/api/v1/auth/register', registrationLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use(apiLimiter); // Default rate limiter for all other routes

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Ensure a single admin coordinator user exists
async function ensureAdminCoordinator() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@placement.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    let admin = await User.findOne({ role: 'coordinator' });

    if (!admin) {
      // Set plain password; User pre-save hook will hash it
      admin = new User({
        name: { first: 'Admin', last: 'Coordinator' },
        email: adminEmail.toLowerCase(),
        passwordHash: adminPassword,
        role: 'coordinator',
        isActive: true,
      });
      await admin.save();
      console.log(`Admin coordinator created with email: ${adminEmail}`);
    } else {
      // Ensure credentials match configured admin account
      admin.email = adminEmail.toLowerCase();
      admin.passwordHash = adminPassword; // will be hashed by pre-save
      admin.role = 'coordinator';
      admin.isActive = true;
      await admin.save();
      console.log(`Admin coordinator credentials reset for email: ${adminEmail}`);
    }
  } catch (err) {
    console.error('Error ensuring admin coordinator:', err);
  }
}

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/trainers', trainerRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/placement-requests', placementRequestRoutes);

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = {
  app,
  ensureAdminCoordinator,
};
