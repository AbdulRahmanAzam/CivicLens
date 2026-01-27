const express = require('express');
const router = express.Router();

const complaintRoutes = require('./complaintRoutes');
const categoryRoutes = require('./categoryRoutes');
const voiceRoutes = require('./voiceRoutes');
const authRoutes = require('./authRoutes');
const whatsappRoutes = require('./whatsappRoutes');

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

// Auth routes (no prefix needed, already /auth)
router.use('/auth', authRoutes);

// Complaint routes
router.use('/complaints', complaintRoutes);

// Category routes
router.use('/categories', categoryRoutes);

// Voice routes
router.use('/voice', voiceRoutes);

// WhatsApp routes
router.use('/whatsapp', whatsappRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to CivicLens API',
    version: '1.0.0',
    documentation: '/api/v1/docs',
    endpoints: {
      auth: {
        'POST /api/v1/auth/register': 'Register a new user',
        'POST /api/v1/auth/login': 'Login user',
        'POST /api/v1/auth/logout': 'Logout (requires auth)',
        'POST /api/v1/auth/refresh-token': 'Refresh access token',
        'GET /api/v1/auth/me': 'Get current user profile (requires auth)',
        'PATCH /api/v1/auth/me': 'Update profile (requires auth)',
        'PATCH /api/v1/auth/change-password': 'Change password (requires auth)',
        'POST /api/v1/auth/forgot-password': 'Request password reset',
        'POST /api/v1/auth/reset-password/:token': 'Reset password with token',
        'GET /api/v1/auth/verify-email/:token': 'Verify email address',
        'GET /api/v1/auth/users': 'Get all users (admin only)',
        'POST /api/v1/auth/users': 'Create user (admin only)',
      },
      complaints: {
        'GET /api/v1/complaints': 'Get all complaints with filters',
        'POST /api/v1/complaints': 'Submit a new complaint',
        'GET /api/v1/complaints/:id': 'Get complaint by ID',
        'PATCH /api/v1/complaints/:id/status': 'Update complaint status',
        'GET /api/v1/complaints/stats': 'Get complaint statistics',
        'GET /api/v1/complaints/heatmap': 'Get heatmap data',
        'GET /api/v1/complaints/heatmap/global': 'Get global heatmap',
        'GET /api/v1/complaints/heatmap/profile/:entityId': 'Get profile heatmap',
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
