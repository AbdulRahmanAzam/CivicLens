const express = require('express');
const router = express.Router();

const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  getStats,
  getHeatmap,
  getAIStats,
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

/**
 * @route   GET /api/v1/complaints/stats
 * @desc    Get complaint statistics
 * @access  Public
 */
router.get('/stats', statsValidation, getStats);

/**
 * @route   GET /api/v1/complaints/ai-stats
 * @desc    Get AI classification and processing statistics
 * @access  Public
 */
router.get('/ai-stats', getAIStats);

/**
 * @route   GET /api/v1/complaints/heatmap
 * @desc    Get heatmap data for visualization
 * @access  Public
 */
router.get('/heatmap', statsValidation, getHeatmap);

/**
 * @route   GET /api/v1/complaints
 * @desc    Get all complaints with filters and pagination
 * @access  Public
 */
router.get('/', getComplaintsValidation, getComplaints);

/**
 * @route   POST /api/v1/complaints
 * @desc    Submit a new complaint
 * @access  Public
 */
router.post(
  '/',
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
 * @access  Public (should be protected in production)
 */
router.patch('/:id/status', updateStatusValidation, updateComplaintStatus);

module.exports = router;
