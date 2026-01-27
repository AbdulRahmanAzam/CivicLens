/**
 * Async Handler Utility
 * Wraps async functions to catch errors and pass to error handler
 * 
 * This is a re-export from errorHandler for compatibility
 */

const { asyncHandler } = require('../middlewares/errorHandler');

module.exports = asyncHandler;
