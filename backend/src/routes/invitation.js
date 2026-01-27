/**
 * Invitation Routes
 * Routes for admin role invitation management
 */

const express = require('express');
const router = express.Router();

const {
  createInvitation,
  validateToken,
  acceptInvitation,
  getPendingInvitations,
  getInvitation,
  revokeInvitation,
  resendInvitation,
  getInvitationStats,
  cleanupExpired,
} = require('../controllers/invitationController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// =====================
// PUBLIC ROUTES
// =====================

// Validate an invitation token (for registration form)
router.get('/validate/:token', validateToken);

// Accept an invitation and register
router.post('/accept', acceptInvitation);

// =====================
// PROTECTED ROUTES
// =====================

// Apply authentication to remaining routes
router.use(protect);

// Get invitation statistics (website admin only)
router.get('/stats', authorize('website_admin'), getInvitationStats);

// Cleanup expired invitations (website admin only)
router.post('/cleanup', authorize('website_admin'), cleanupExpired);

// Main invitation routes
router.route('/')
  .get(authorize('website_admin', 'mayor', 'town_chairman'), getPendingInvitations)
  .post(authorize('website_admin', 'mayor', 'town_chairman'), createInvitation);

// Single invitation routes
router.route('/:id')
  .get(authorize('website_admin', 'mayor', 'town_chairman'), getInvitation)
  .delete(authorize('website_admin', 'mayor', 'town_chairman'), revokeInvitation);

// Resend invitation
router.post('/:id/resend', authorize('website_admin', 'mayor', 'town_chairman'), resendInvitation);

module.exports = router;
