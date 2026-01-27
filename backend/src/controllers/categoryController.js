const { Category } = require('../models');
const { asyncHandler, AppError } = require('../middlewares/errorHandler');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Category Controller
 * Handles HTTP requests for category operations
 */

/**
 * @desc    Get all categories
 * @route   GET /api/v1/categories
 * @access  Public
 */
const getCategories = asyncHandler(async (req, res) => {
  const { active } = req.query;

  const filter = {};
  if (active !== undefined) {
    filter.isActive = active === 'true';
  }

  const categories = await Category.find(filter).sort({ priority: -1, name: 1 });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      categories: categories.map((cat) => ({
        id: cat._id,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        department: cat.department,
        priority: cat.priority,
        slaHours: cat.slaHours,
        isActive: cat.isActive,
      })),
      count: categories.length,
    },
  });
});

/**
 * @desc    Get single category by name
 * @route   GET /api/v1/categories/:name
 * @access  Public
 */
const getCategoryByName = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ name: req.params.name });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: category,
  });
});

/**
 * @desc    Seed default categories
 * @route   POST /api/v1/categories/seed
 * @access  Admin only (should be protected in production)
 */
const seedCategories = asyncHandler(async (req, res) => {
  await Category.seedDefaults();

  const categories = await Category.find().sort({ name: 1 });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Default categories seeded successfully',
    data: {
      categories: categories.map((cat) => cat.name),
      count: categories.length,
    },
  });
});

/**
 * @desc    Classify text to a category
 * @route   POST /api/v1/categories/classify
 * @access  Public
 */
const classifyText = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    throw new AppError('Text is required for classification', 400);
  }

  const result = await Category.classifyByKeywords(text);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      category: result.category,
      confidence: Math.round(result.confidence * 100),
      confidenceLevel:
        result.confidence > 0.7
          ? 'high'
          : result.confidence > 0.4
          ? 'medium'
          : 'low',
    },
  });
});

/**
 * @desc    Get category statistics
 * @route   GET /api/v1/categories/stats
 * @access  Public
 */
const getCategoryStats = asyncHandler(async (req, res) => {
  const { Complaint } = require('../models');

  // Get complaint counts by category
  const stats = await Complaint.aggregate([
    {
      $group: {
        _id: '$category.primary',
        total: { $sum: 1 },
        resolved: {
          $sum: {
            $cond: [{ $in: ['$status.current', ['resolved', 'closed']] }, 1, 0],
          },
        },
        pending: {
          $sum: {
            $cond: [
              { $in: ['$status.current', ['reported', 'acknowledged', 'in_progress']] },
              1,
              0,
            ],
          },
        },
        avgSeverity: { $avg: '$severity.score' },
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: 'name',
        as: 'categoryInfo',
      },
    },
    {
      $unwind: {
        path: '$categoryInfo',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        category: '$_id',
        total: 1,
        resolved: 1,
        pending: 1,
        avgSeverity: { $round: ['$avgSeverity', 1] },
        resolutionRate: {
          $round: [
            { $multiply: [{ $divide: ['$resolved', { $max: ['$total', 1] }] }, 100] },
            1,
          ],
        },
        color: { $ifNull: ['$categoryInfo.color', '#6B7280'] },
        icon: { $ifNull: ['$categoryInfo.icon', 'category-default'] },
      },
    },
    {
      $sort: { total: -1 },
    },
  ]);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      stats,
      totalCategories: stats.length,
    },
  });
});

module.exports = {
  getCategories,
  getCategoryByName,
  seedCategories,
  classifyText,
  getCategoryStats,
};
