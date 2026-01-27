const express = require('express');
const router = express.Router();

const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  getStats,
  getHeatmap,
  getGlobalHeatmap,
  getProfileHeatmap,
  getAIStats,
  submitCitizenFeedback,
  getSLABreaches,
  getMyComplaints,
} = require('../controllers/complaintController');

const {
  createComplaintValidation,
  getComplaintsValidation,
  getComplaintByIdValidation,
  updateStatusValidation,
  statsValidation,
} = require('../middlewares/validateRequest');

const {
  uploadImagesMiddleware,
  validateUploadedFiles,
} = require('../middlewares/uploadMiddleware');

const { 
  protect, 
  authorize, 
  optionalAuth,
  hierarchyAccess,
} = require('../middlewares/authMiddleware');

/**
 * @route   GET /api/v1/complaints/stats
 * @desc    Get complaint statistics
 * @access  Public (optionally filtered by hierarchy)
 */
router.get('/stats', optionalAuth, hierarchyAccess, statsValidation, getStats);

/**
 * @route   GET /api/v1/complaints/ai-stats
 * @desc    Get AI classification and processing statistics
 * @access  Public
 */
router.get('/ai-stats', getAIStats);

/**
 * @route   GET /api/v1/complaints/sla-breaches
 * @desc    Get SLA breach summary
 * @access  Protected - UC Chairman+
 */
router.get(
  '/sla-breaches',
  protect,
  authorize('uc_chairman', 'town_chairman', 'mayor', 'website_admin'),
  hierarchyAccess,
  getSLABreaches
);

/**
 * @route   GET /api/v1/complaints/my
 * @desc    Get current user's complaints
 * @access  Protected - Citizen
 */
router.get('/my', protect, getMyComplaints);

/**
 * @route   GET /api/v1/complaints/heatmap
 * @desc    Get heatmap data for visualization
 * @access  Public
 */
router.get('/heatmap', statsValidation, getHeatmap);

/**
 * @route   GET /api/v1/complaints/heatmap/global
 * @desc    Get global heatmap (all complaints, severity-weighted)
 * @access  Public
 */
router.get('/heatmap/global', statsValidation, getGlobalHeatmap);

/**
 * @route   GET /api/v1/complaints/heatmap/profile/:entityId
 * @desc    Get profile heatmap (resolved complaints by specific entity)
 * @access  Public
 */
router.get('/heatmap/profile/:entityId', getProfileHeatmap);

/**
 * @route   GET /api/v1/complaints
 * @desc    Get all complaints with filters and pagination
 * @access  Public (optionally filtered by hierarchy for authenticated users)
 */
router.get('/', optionalAuth, hierarchyAccess, getComplaintsValidation, getComplaints);

/**
 * @route   POST /api/v1/complaints
 * @desc    Submit a new complaint
 * @access  Public (optionalAuth for linking to user account)
 */
router.post(
  '/',
  optionalAuth,
  uploadImagesMiddleware,
  validateUploadedFiles,
  createComplaintValidation,
  createComplaint
);

/**
 * @route   GET /api/v1/complaints/:id
 * @desc    Get single complaint by ID
 * @access  Public
 */
router.get('/:id', getComplaintByIdValidation, getComplaintById);

/**
 * @route   PATCH /api/v1/complaints/:id/status
 * @desc    Update complaint status
 * @access  Protected - UC Chairman, Town Chairman, Mayor, Website Admin
 */
router.patch(
  '/:id/status',
  protect,
  authorize('uc_chairman', 'town_chairman', 'mayor', 'website_admin', 'citizen'),
  updateStatusValidation,
  updateComplaintStatus
);

/**
 * @route   POST /api/v1/complaints/:id/feedback
 * @desc    Submit citizen feedback for resolved complaint
 * @access  Protected - Citizen (own complaints only)
 */
router.post(
  '/:id/feedback',
  protect,
  authorize('citizen'),
  submitCitizenFeedback
);

module.exports = router;
