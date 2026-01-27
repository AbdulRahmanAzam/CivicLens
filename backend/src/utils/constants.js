/**
 * Constants used throughout the application
 */

/**
 * Complaint Categories
 */
const CATEGORIES = {
  ROADS: 'Roads',
  WATER: 'Water',
  GARBAGE: 'Garbage',
  ELECTRICITY: 'Electricity',
  OTHERS: 'Others',
};

const CATEGORY_LIST = Object.values(CATEGORIES);

/**
 * Complaint Status
 */
const STATUS = {
  REPORTED: 'reported',
  ACKNOWLEDGED: 'acknowledged',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  REJECTED: 'rejected',
};

const STATUS_LIST = Object.values(STATUS);

/**
 * Valid status transitions
 */
const VALID_STATUS_TRANSITIONS = {
  [STATUS.REPORTED]: [STATUS.ACKNOWLEDGED, STATUS.REJECTED],
  [STATUS.ACKNOWLEDGED]: [STATUS.IN_PROGRESS, STATUS.REJECTED],
  [STATUS.IN_PROGRESS]: [STATUS.RESOLVED, STATUS.REJECTED],
  [STATUS.RESOLVED]: [STATUS.CLOSED],
  [STATUS.CLOSED]: [],
  [STATUS.REJECTED]: [],
};

/**
 * Complaint Sources
 */
const SOURCES = {
  WEB: 'web',
  MOBILE: 'mobile',
  WHATSAPP: 'whatsapp',
  VOICE: 'voice',
};

const SOURCE_LIST = Object.values(SOURCES);

/**
 * User Roles
 */
const ROLES = {
  CITIZEN: 'citizen',
  OFFICER: 'officer',
  SUPERVISOR: 'supervisor',
  ADMIN: 'admin',
};

const ROLE_LIST = Object.values(ROLES);

/**
 * Severity Levels
 */
const SEVERITY = {
  MIN: 1,
  MAX: 10,
  DEFAULT: 5,
  CRITICAL_THRESHOLD: 8,
  HIGH_THRESHOLD: 6,
  MEDIUM_THRESHOLD: 4,
};

/**
 * Pagination defaults
 */
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

/**
 * Geo-search defaults
 */
const GEO = {
  DEFAULT_RADIUS: 1000, // meters
  MAX_RADIUS: 50000, // 50km
  MIN_RADIUS: 100, // 100m
};

/**
 * File upload limits
 */
const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 5,
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
};

/**
 * Time-related constants
 */
const TIME = {
  HOURS_PER_DAY: 24,
  MS_PER_HOUR: 3600000,
  MS_PER_DAY: 86400000,
  DEFAULT_REPORT_DAYS: 30,
};

/**
 * Error Messages
 */
const ERROR_MESSAGES = {
  NOT_FOUND: 'Resource not found',
  COMPLAINT_NOT_FOUND: 'Complaint not found',
  INVALID_STATUS_TRANSITION: 'Invalid status transition',
  VALIDATION_FAILED: 'Validation failed',
  UNAUTHORIZED: 'Unauthorized access',
  SERVER_ERROR: 'Internal server error',
  UPLOAD_FAILED: 'File upload failed',
  GEOCODING_FAILED: 'Geocoding service unavailable',
};

/**
 * Success Messages
 */
const SUCCESS_MESSAGES = {
  COMPLAINT_CREATED: 'Complaint registered successfully',
  COMPLAINT_UPDATED: 'Complaint updated successfully',
  STATUS_UPDATED: 'Status updated successfully',
  FILE_UPLOADED: 'File uploaded successfully',
};

/**
 * HTTP Status Codes
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  SERVER_ERROR: 500,
};

module.exports = {
  CATEGORIES,
  CATEGORY_LIST,
  STATUS,
  STATUS_LIST,
  VALID_STATUS_TRANSITIONS,
  SOURCES,
  SOURCE_LIST,
  ROLES,
  ROLE_LIST,
  SEVERITY,
  PAGINATION,
  GEO,
  UPLOAD,
  TIME,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  HTTP_STATUS,
};
