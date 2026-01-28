const express = require('express');
const router = express.Router();

const complaintRoutes = require('./complaintRoutes');
const categoryRoutes = require('./categoryRoutes');
const voiceRoutes = require('./voiceRoutes');
const authRoutes = require('./authRoutes');
const whatsappRoutes = require('./whatsappRoutes');
const hierarchyRoutes = require('./hierarchy');
const invitationRoutes = require('./invitation');
const analyticsRoutes = require('./analytics');
const territoryRoutes = require('./territoryRoutes');
const chatbotRoutes = require('./chatbotRoutes');

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
// Hierarchy routes (City → Town → UC management)
router.use('/hierarchy', hierarchyRoutes);

// Invitation routes (Admin role invitations)
router.use('/invitations', invitationRoutes);

// Analytics routes (hierarchy-based reporting)
router.use('/analytics', analyticsRoutes);

// Territory routes (for map visualization and admin management)
router.use('/territories', territoryRoutes);

// Chatbot routes (AI assistant)
router.use('/chatbot', chatbotRoutes);

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
      hierarchy: {
        'GET /api/v1/hierarchy/tree': 'Get full City → Town → UC tree',
        'POST /api/v1/hierarchy/find-uc': 'Find UC by location',
        'POST /api/v1/hierarchy/nearby-ucs': 'Get nearby UCs for selection',
        'GET /api/v1/hierarchy/stats': 'Get hierarchy statistics (admin)',
        'GET /api/v1/hierarchy/cities': 'Get all cities',
        'POST /api/v1/hierarchy/cities': 'Create city (website_admin)',
        'GET /api/v1/hierarchy/cities/:cityId': 'Get city details',
        'GET /api/v1/hierarchy/cities/:cityId/towns': 'Get towns in city',
        'POST /api/v1/hierarchy/cities/:cityId/towns': 'Create town',
        'GET /api/v1/hierarchy/towns/:townId': 'Get town details',
        'GET /api/v1/hierarchy/towns/:townId/ucs': 'Get UCs in town',
        'POST /api/v1/hierarchy/towns/:townId/ucs': 'Create UC',
        'GET /api/v1/hierarchy/ucs/:ucId': 'Get UC details',
      },
      invitations: {
        'POST /api/v1/invitations': 'Create invitation (admin roles)',
        'GET /api/v1/invitations': 'Get pending invitations',
        'GET /api/v1/invitations/validate/:token': 'Validate invitation token',
        'POST /api/v1/invitations/accept': 'Accept invitation & register',
        'DELETE /api/v1/invitations/:id': 'Revoke invitation',
        'POST /api/v1/invitations/:id/resend': 'Resend invitation',
        'GET /api/v1/invitations/stats': 'Get invitation stats (admin)',
      },
      analytics: {
        'GET /api/v1/analytics/system': 'System-wide analytics (website_admin)',
        'GET /api/v1/analytics/city/:cityId': 'City analytics (mayor+)',
        'GET /api/v1/analytics/town/:townId': 'Town analytics (town_chairman+)',
        'GET /api/v1/analytics/uc/:ucId': 'UC analytics (uc_chairman+)',
        'GET /api/v1/analytics/sla-performance': 'SLA performance report',
      },
      territories: {
        'GET /api/v1/territories': 'Get territories with boundaries (level=UC|Town, city=name)',
        'GET /api/v1/territories/ucs': 'Get UC list (without boundaries)',
        'GET /api/v1/territories/towns': 'Get Town list (without boundaries)',
        'GET /api/v1/territories/cities': 'Get City list',
        'GET /api/v1/territories/:id': 'Get territory by ID',
        'POST /api/v1/territories': 'Create territory (admin)',
        'PUT /api/v1/territories/:id': 'Update territory (admin)',
        'DELETE /api/v1/territories/:id': 'Delete territory (admin)',
      },
      chatbot: {
        'POST /api/v1/chatbot/message': 'Send message to AI chatbot (public)',
        'GET /api/v1/chatbot/greeting': 'Get chatbot greeting message',
        'GET /api/v1/chatbot/quick-actions': 'Get quick action suggestions',
      },
    },
  });
});

module.exports = router;
