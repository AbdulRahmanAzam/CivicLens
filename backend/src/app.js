const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

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

// CORS configuration
app.use(cors({
  origin: env.corsOrigin,
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
