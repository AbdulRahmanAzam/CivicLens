/**
 * Analytics Routes
 * Routes for hierarchy-based analytics and reporting
 */

const express = require('express');
const router = express.Router();

const {
  getUCAnalytics,
  getTownAnalytics,
  getCityAnalytics,
  getSystemAnalytics,
  getSLAPerformance,
} = require('../controllers/analyticsController');

const { 
  protect, 
  authorize,
  hierarchyAccess,
} = require('../middlewares/authMiddleware');

// Apply authentication to all routes
router.use(protect);

/**
 * @route   GET /api/v1/analytics/system
 * @desc    Get system-wide analytics
 * @access  Website Admin only
 */
router.get(
  '/system',
  authorize('website_admin'),
  getSystemAnalytics
);

/**
 * @route   GET /api/v1/analytics/sla-performance
 * @desc    Get SLA performance report
 * @access  Town Chairman+
 */
router.get(
  '/sla-performance',
  authorize('town_chairman', 'mayor', 'website_admin'),
  hierarchyAccess,
  getSLAPerformance
);

/**
 * @route   GET /api/v1/analytics/city/:cityId
 * @desc    Get city-level analytics
 * @access  Mayor (own city), Website Admin
 */
router.get(
  '/city/:cityId',
  authorize('mayor', 'website_admin'),
  getCityAnalytics
);

/**
 * @route   GET /api/v1/analytics/town/:townId
 * @desc    Get town-level analytics
 * @access  Town Chairman (own town), Mayor+
 */
router.get(
  '/town/:townId',
  authorize('town_chairman', 'mayor', 'website_admin'),
  getTownAnalytics
);

/**
 * @route   GET /api/v1/analytics/uc/:ucId
 * @desc    Get UC-level analytics
 * @access  UC Chairman (own UC), Town Chairman+
 */
router.get(
  '/uc/:ucId',
  authorize('uc_chairman', 'town_chairman', 'mayor', 'website_admin'),
  getUCAnalytics
);

module.exports = router;
