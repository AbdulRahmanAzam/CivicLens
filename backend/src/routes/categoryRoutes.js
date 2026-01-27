const express = require('express');
const router = express.Router();

const {
  getCategories,
  getCategoryByName,
  seedCategories,
  classifyText,
  getCategoryStats,
} = require('../controllers/categoryController');

const { protect, authorize } = require('../middlewares/authMiddleware');

/**
 * @route   GET /api/v1/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/', getCategories);

/**
 * @route   GET /api/v1/categories/stats
 * @desc    Get category statistics
 * @access  Public
 */
router.get('/stats', getCategoryStats);

/**
 * @route   POST /api/v1/categories/seed
 * @desc    Seed default categories (admin only)
 * @access  Admin, Superadmin
 */
router.post('/seed', protect, authorize('admin', 'superadmin'), seedCategories);

/**
 * @route   POST /api/v1/categories/classify
 * @desc    Classify text into a category
 * @access  Public
 */
router.post('/classify', classifyText);

/**
 * @route   GET /api/v1/categories/:name
 * @desc    Get single category by name
 * @access  Public
 */
router.get('/:name', getCategoryByName);

module.exports = router;
