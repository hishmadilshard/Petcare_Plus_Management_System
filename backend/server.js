/**
 * =====================================================
 * PetCare Plus Management System - Backend API
 * Version: 1.0.0
 * Author: Hishma Dilshar (K2557675)
 * =====================================================
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import configurations
const { sequelize, testConnection } = require('./config/db.config');
const securityLogger = require('./utils/securityLogger');
const { verifyEmailConfig } = require('./utils/emailService');


// Import middleware
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const routes = require('./routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes'); // ADD THIS LINE


// =====================================================
// Initialize Express App
// =====================================================
const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// =====================================================
// Security Middleware
// =====================================================

// Helmet - Set security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.ADMIN_PANEL_URL,
      process.env.MOBILE_APP_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:19006' // Expo default
    ];

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// =====================================================
// Body Parsing Middleware
// =====================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =====================================================
// Logging Middleware
// =====================================================
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => securityLogger.info(message.trim())
    }
  }));
}

// =====================================================
// Static Files
// =====================================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =====================================================
// Rate Limiting
// =====================================================
app.use('/api', apiLimiter);

// =====================================================
// API Routes
// =====================================================
app.use('/api', routes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // ADD THIS LINE

// =====================================================
// Root Endpoint
// =====================================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to PetCare Plus Management System API',
    version: '1.0.0',
    environment: NODE_ENV,
    endpoints: {
      api: '/api',
      health: '/api/health',
      documentation: '/api'
    },
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// Error Handling Middleware
// =====================================================

// 404 Not Found Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

// =====================================================
// Graceful Shutdown Handler
// =====================================================
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  try {
    // Close database connection
    await sequelize.close();
    console.log('✅ Database connection closed');
    
    // Close server
    server.close(() => {
      console.log('✅ HTTP server closed');
      console.log('👋 Graceful shutdown completed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('⚠️ Forcefully shutting down');
      process.exit(1);
    }, 10000);

  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(error.name, error.message);
  securityLogger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error('Reason:', reason);
  securityLogger.error('Unhandled Rejection', {
    reason: reason,
    promise: promise
  });
  process.exit(1);
});

// =====================================================
// Start Server
// =====================================================
const startServer = async () => {
  try {
    console.log('\n🚀 Starting PetCare Plus Management System API...\n');

    // Test database connection
    console.log('📊 Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Sync database models (be careful in production)
    if (NODE_ENV === 'development') {
      console.log('🔄 Syncing database models...');
      await sequelize.sync({ alter: false }); // Set to true only if needed
      console.log('✅ Database models synchronized');
    }

    // Verify email configuration
    console.log('📧 Verifying email configuration...');
    await verifyEmailConfig();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log('\n========================================');
      console.log(`✅ Server Status: RUNNING`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
      console.log(`🚀 Server running on port: ${PORT}`);
      console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📚 Documentation: http://localhost:${PORT}/api`);
      console.log('========================================\n');
      
      securityLogger.info('Server started successfully', {
        port: PORT,
        environment: NODE_ENV,
        nodeVersion: process.version
      });
    });

    // Export server for graceful shutdown
    global.server = server;

  } catch (error) {
    console.error('\n❌ Failed to start server:');
    console.error(error.message);
    securityLogger.error('Server startup failed', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

// =====================================================
// Initialize Application
// =====================================================
startServer();

// Export app for testing
module.exports = app;