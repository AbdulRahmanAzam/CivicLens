const { AppError, errorHandler, notFound, asyncHandler } = require('./errorHandler');
const {
  handleValidation,
  createComplaintValidation,
  getComplaintsValidation,
  getComplaintByIdValidation,
  updateStatusValidation,
  statsValidation,
} = require('./validateRequest');
const {
  uploadImages,
  uploadSingleImage,
  uploadImagesMiddleware,
  uploadSingleImageMiddleware,
  validateUploadedFiles,
  handleUploadError,
} = require('./uploadMiddleware');
const {
  protect,
  optionalAuth,
  authorize,
  requireVerified,
  authRateLimiter,
  checkOwnership,
  departmentAccess,
  auditAuth,
  minRole,
  ROLE_HIERARCHY,
} = require('./authMiddleware');

module.exports = {
  // Error handling
  AppError,
  errorHandler,
  notFound,
  asyncHandler,
  
  // Validation
  handleValidation,
  createComplaintValidation,
  getComplaintsValidation,
  getComplaintByIdValidation,
  updateStatusValidation,
  statsValidation,
  
  // File uploads
  uploadImages,
  uploadSingleImage,
  uploadImagesMiddleware,
  uploadSingleImageMiddleware,
  validateUploadedFiles,
  handleUploadError,
  
  // Authentication & Authorization
  protect,
  optionalAuth,
  authorize,
  requireVerified,
  authRateLimiter,
  checkOwnership,
  departmentAccess,
  auditAuth,
  minRole,
  ROLE_HIERARCHY,
};
