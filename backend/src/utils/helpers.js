const { SEVERITY, VALID_STATUS_TRANSITIONS } = require('./constants');

/**
 * Generate unique complaint ID
 * Format: CL-YYYYMMDD-XXXXX (e.g., CL-20260127-00001)
 */
const generateComplaintId = async () => {
  const Complaint = require('../models/Complaint');
  
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Find the latest complaint ID for today
  const latestComplaint = await Complaint.findOne({
    complaintId: { $regex: `^CL-${dateStr}-` },
  }).sort({ complaintId: -1 });
  
  let sequence = 1;
  if (latestComplaint) {
    const lastSequence = parseInt(latestComplaint.complaintId.split('-')[2], 10);
    sequence = lastSequence + 1;
  }
  
  return `CL-${dateStr}-${String(sequence).padStart(5, '0')}`;
};

/**
 * Calculate severity score based on various factors
 * @param {Object} params - Parameters for severity calculation
 * @param {string} params.category - Complaint category
 * @param {number} params.nearbyCount - Number of similar complaints nearby
 * @param {number} params.duration - Hours since issue first reported in area
 * @param {string} params.description - Complaint description
 * @returns {Object} - Severity score and factors
 */
const calculateSeverity = ({ category, nearbyCount = 0, duration = 0, description = '' }) => {
  let score = SEVERITY.DEFAULT;
  const factors = {
    frequency: 0,
    duration: 0,
    areaImpact: 0,
  };
  
  // Category base scores
  const categoryScores = {
    Water: 7,
    Electricity: 7,
    Roads: 6,
    Garbage: 5,
    Others: 4,
  };
  
  score = categoryScores[category] || SEVERITY.DEFAULT;
  
  // Frequency factor (more nearby complaints = higher severity)
  if (nearbyCount > 0) {
    factors.frequency = Math.min(nearbyCount * 0.5, 2);
    score += factors.frequency;
  }
  
  // Duration factor (longer unresolved = higher severity)
  if (duration > 0) {
    const durationDays = duration / 24;
    factors.duration = Math.min(durationDays * 0.3, 1.5);
    score += factors.duration;
  }
  
  // Keywords that indicate urgency
  const urgentKeywords = ['urgent', 'emergency', 'dangerous', 'hazard', 'risk', 'injured', 'accident', 'flooding'];
  const lowerDesc = description.toLowerCase();
  
  for (const keyword of urgentKeywords) {
    if (lowerDesc.includes(keyword)) {
      factors.areaImpact += 0.5;
    }
  }
  
  score += factors.areaImpact;
  
  // Clamp score between 1 and 10
  score = Math.max(SEVERITY.MIN, Math.min(SEVERITY.MAX, Math.round(score)));
  
  return {
    score,
    factors,
  };
};

/**
 * Check if status transition is valid
 */
const isValidStatusTransition = (currentStatus, newStatus) => {
  const validNextStatuses = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  return validNextStatuses.includes(newStatus);
};

/**
 * Format date for API responses
 */
const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString();
};

/**
 * Calculate date range
 * @param {number} days - Number of days to go back
 * @returns {Object} - Start and end dates
 */
const getDateRange = (days) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  
  return {
    start,
    end,
  };
};

/**
 * Sanitize user input
 * Removes potentially harmful characters
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, ''); // Remove remaining angle brackets
};

/**
 * Generate pagination metadata
 */
const getPaginationMeta = (page, limit, totalCount) => {
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    currentPage: page,
    totalPages,
    totalCount,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    limit,
  };
};

/**
 * Build MongoDB query from filters
 */
const buildComplaintQuery = (filters) => {
  const query = {};
  
  if (filters.category) {
    query['category.primary'] = filters.category;
  }
  
  if (filters.status) {
    query['status.current'] = filters.status;
  }
  
  if (filters.area) {
    query['location.area'] = new RegExp(filters.area, 'i');
  }
  
  if (filters.ward) {
    query['location.ward'] = filters.ward;
  }
  
  if (filters.severity_min || filters.severity_max) {
    query['severity.score'] = {};
    if (filters.severity_min) {
      query['severity.score'].$gte = filters.severity_min;
    }
    if (filters.severity_max) {
      query['severity.score'].$lte = filters.severity_max;
    }
  }
  
  if (filters.date_from || filters.date_to) {
    query.createdAt = {};
    if (filters.date_from) {
      query.createdAt.$gte = new Date(filters.date_from);
    }
    if (filters.date_to) {
      query.createdAt.$lte = new Date(filters.date_to);
    }
  }
  
  return query;
};

/**
 * Build MongoDB sort object
 */
const buildSortObject = (sortBy = 'createdAt', sortOrder = 'desc') => {
  const sortMap = {
    createdAt: 'createdAt',
    severity: 'severity.score',
    status: 'status.current',
  };
  
  const field = sortMap[sortBy] || 'createdAt';
  const order = sortOrder === 'asc' ? 1 : -1;
  
  return { [field]: order };
};

/**
 * Convert coordinates to GeoJSON format
 */
const toGeoJSON = (longitude, latitude) => {
  return {
    type: 'Point',
    coordinates: [parseFloat(longitude), parseFloat(latitude)],
  };
};

/**
 * Parse phone number (basic normalization)
 */
const normalizePhoneNumber = (phone) => {
  if (!phone) return null;
  
  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  return cleaned;
};

/**
 * Generate random ID (for testing/mock purposes)
 */
const generateRandomId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Sleep utility (for testing/debugging)
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  generateComplaintId,
  calculateSeverity,
  isValidStatusTransition,
  formatDate,
  getDateRange,
  sanitizeInput,
  getPaginationMeta,
  buildComplaintQuery,
  buildSortObject,
  toGeoJSON,
  normalizePhoneNumber,
  generateRandomId,
  sleep,
};
