const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const env = require('./config/env');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

/**
 * Create Express application
 */
const app = express();

/**
 * Security Middleware
 */
// Helmet helps secure Express apps by setting various HTTP headers
app.use(helmet());

// CORS configuration - support multiple origins for development
const allowedOrigins = env.corsOrigin.split(',').map(origin => origin.trim());
const allowAllOrigins = allowedOrigins.includes('*');

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // If wildcard is set, allow all origins
    if (allowAllOrigins) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // In development, allow localhost on any port
    if (env.isDevelopment() && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

/**
 * Body Parsing Middleware
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Logging Middleware
 */
if (env.isDevelopment()) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

/**
 * Request timestamp middleware
 */
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

/**
 * API Routes
 */
app.use('/api/v1', routes);

/**
 * Static uploads
 */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CivicLens Backend API',
    version: '1.0.0',
    documentation: '/api/v1',
    health: '/api/v1/health',
  });
});

/**
 * Handle 404 - Not Found
 */
app.use(notFound);

/**
 * Global Error Handler
 */
app.use(errorHandler);

module.exports = app;
