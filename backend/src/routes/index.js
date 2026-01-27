const express = require('express');
const router = express.Router();

const complaintRoutes = require('./complaintRoutes');
const categoryRoutes = require('./categoryRoutes');
const voiceRoutes = require('./voiceRoutes');

/**
 * API Routes
 * Base path: /api/v1
 */

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CivicLens API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Complaint routes
router.use('/complaints', complaintRoutes);

// Category routes
router.use('/categories', categoryRoutes);

// Voice routes
router.use('/voice', voiceRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to CivicLens API',
    version: '1.0.0',
    documentation: '/api/v1/docs',
    endpoints: {
      complaints: {
        'GET /api/v1/complaints': 'Get all complaints with filters',
        'POST /api/v1/complaints': 'Submit a new complaint',
        'GET /api/v1/complaints/:id': 'Get complaint by ID',
        'PATCH /api/v1/complaints/:id/status': 'Update complaint status',
        'GET /api/v1/complaints/stats': 'Get complaint statistics',
        'GET /api/v1/complaints/heatmap': 'Get heatmap data',
      },
      categories: {
        'GET /api/v1/categories': 'Get all categories',
        'GET /api/v1/categories/:name': 'Get category by name',
        'GET /api/v1/categories/stats': 'Get category statistics',
        'POST /api/v1/categories/seed': 'Seed default categories',
        'POST /api/v1/categories/classify': 'Classify text to category',
      },
      voice: {
        'POST /api/v1/voice/complaint': 'Submit voice complaint',
        'POST /api/v1/voice/transcribe': 'Transcribe audio only',
        'GET /api/v1/voice/status': 'Get speech service status',
        'GET /api/v1/voice/languages': 'Get supported languages',
      },
    },
  });
});

module.exports = router;
