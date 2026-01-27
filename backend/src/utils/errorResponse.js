/**
 * Error Response Utility
 * Custom error class for consistent API error responses
 * 
 * This is a re-export/alias of AppError for compatibility
 */

const { AppError } = require('../middlewares/errorHandler');

/**
 * ErrorResponse class
 * Extends AppError for backward compatibility
 */
class ErrorResponse extends AppError {
  constructor(message, statusCode) {
    super(message, statusCode);
    this.name = 'ErrorResponse';
  }
}

module.exports = ErrorResponse;
