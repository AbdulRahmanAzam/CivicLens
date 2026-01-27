const { complaintService } = require('../services');
const { asyncHandler, AppError } = require('../middlewares/errorHandler');
const { SUCCESS_MESSAGES, HTTP_STATUS } = require('../utils/constants');

/**
 * Complaint Controller
 * Handles HTTP requests for complaint operations
 */

/**
 * @desc    Submit a new complaint
 * @route   POST /api/v1/complaints
 * @access  Public
 */
const createComplaint = asyncHandler(async (req, res) => {
  const {
    description,
    phone,
    name,
    email,
    latitude,
    longitude,
    address,
    source,
  } = req.body;

  // Add request metadata
  const data = {
    description,
    phone,
    name,
    email,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    address,
    source,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
  };

  const result = await complaintService.createComplaint(data, req.files);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: SUCCESS_MESSAGES.COMPLAINT_CREATED,
    data: {
      complaintId: result.complaint.complaintId,
      category: {
        primary: result.complaint.category.primary,
        subcategory: result.complaint.category.subcategory,
        urgency: result.complaint.category.urgency,
        keywords: result.complaint.category.keywords,
        source: result.complaint.category.classificationSource,
        needsReview: result.complaint.category.needsReview,
      },
      severity: {
        score: result.complaint.severity.score,
        priority: result.complaint.severity.priority,
        factors: result.complaint.severity.factors,
      },
      status: result.complaint.status.current,
      location: {
        address: result.complaint.location.address,
        area: result.complaint.location.area,
      },
      duplicateInfo: result.duplicateCheck.isDuplicate
        ? {
            isDuplicate: true,
            similarTo: result.duplicateCheck.potentialDuplicate,
            similarity: result.duplicateCheck.similarity,
          }
        : { isDuplicate: false },
      aiProcessing: {
        processedAt: result.complaint.metadata?.aiProcessing?.processedAt,
        classificationTime: result.complaint.metadata?.aiProcessing?.classificationTime,
      },
    },
  });
});

/**
 * @desc    Get complaints with filters
 * @route   GET /api/v1/complaints
 * @access  Public
 */
const getComplaints = asyncHandler(async (req, res) => {
  const filters = {
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 20,
    category: req.query.category,
    status: req.query.status,
    area: req.query.area,
    ward: req.query.ward,
    severity_min: req.query.severity_min ? parseInt(req.query.severity_min, 10) : undefined,
    severity_max: req.query.severity_max ? parseInt(req.query.severity_max, 10) : undefined,
    date_from: req.query.date_from,
    date_to: req.query.date_to,
    lat: req.query.lat ? parseFloat(req.query.lat) : undefined,
    lng: req.query.lng ? parseFloat(req.query.lng) : undefined,
    radius: req.query.radius ? parseInt(req.query.radius, 10) : undefined,
    sort_by: req.query.sort_by,
    sort_order: req.query.sort_order,
  };

  // Remove undefined values
  Object.keys(filters).forEach((key) => {
    if (filters[key] === undefined) {
      delete filters[key];
    }
  });

  const result = await complaintService.getComplaints(filters);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      complaints: result.complaints.map(formatComplaintResponse),
      pagination: result.pagination,
    },
  });
});

/**
 * @desc    Get single complaint by ID
 * @route   GET /api/v1/complaints/:id
 * @access  Public
 */
const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await complaintService.getComplaintById(req.params.id);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: formatComplaintResponse(complaint.toObject()),
  });
});

/**
 * @desc    Update complaint status
 * @route   PATCH /api/v1/complaints/:id/status
 * @access  Public (should be protected in production)
 */
const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { status, remarks, updatedBy } = req.body;

  const complaint = await complaintService.updateStatus(req.params.id, {
    status,
    remarks,
    updatedBy,
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.STATUS_UPDATED,
    data: {
      complaintId: complaint.complaintId,
      currentStatus: complaint.status.current,
      statusHistory: complaint.status.history,
    },
  });
});

/**
 * @desc    Get complaint statistics
 * @route   GET /api/v1/complaints/stats
 * @access  Public
 */
const getStats = asyncHandler(async (req, res) => {
  const filters = {
    dateFrom: req.query.date_from,
    dateTo: req.query.date_to,
    area: req.query.area,
  };

  const stats = await complaintService.getStats(filters);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: stats,
  });
});

/**
 * @desc    Get heatmap data
 * @route   GET /api/v1/complaints/heatmap
 * @access  Public
 */
const getHeatmap = asyncHandler(async (req, res) => {
  const filters = {
    category: req.query.category,
    days: req.query.days ? parseInt(req.query.days, 10) : 30,
  };

  const clusters = await complaintService.getHeatmapData(filters);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      clusters,
      count: clusters.length,
    },
  });
});

/**
 * @desc    Get global heatmap (all complaints, severity-weighted)
 * @route   GET /api/v1/complaints/heatmap/global
 * @access  Public
 */
const getGlobalHeatmap = asyncHandler(async (req, res) => {
  const filters = {
    category: req.query.category,
    days: req.query.days ? parseInt(req.query.days, 10) : 30,
    precision: req.query.precision ? parseInt(req.query.precision, 10) : 3,
  };

  const clusters = await complaintService.getGlobalHeatmap(filters);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Global heatmap data retrieved successfully',
    data: {
      type: 'global',
      filters: {
        category: filters.category || 'all',
        days: filters.days,
        precision: filters.precision,
      },
      clusters,
      count: clusters.length,
      totalIntensity: clusters.reduce((sum, c) => sum + c.intensity, 0),
    },
  });
});

/**
 * @desc    Get profile heatmap (resolved complaints by entity)
 * @route   GET /api/v1/complaints/heatmap/profile/:entityId
 * @access  Public
 */
const getProfileHeatmap = asyncHandler(async (req, res) => {
  const { entityId } = req.params;

  if (!entityId) {
    throw new AppError('Entity ID is required', HTTP_STATUS.BAD_REQUEST);
  }

  const filters = {
    days: req.query.days ? parseInt(req.query.days, 10) : 365,
    precision: req.query.precision ? parseInt(req.query.precision, 10) : 3,
  };

  const result = await complaintService.getProfileHeatmap(entityId, filters);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Profile heatmap data retrieved successfully',
    data: {
      type: 'profile',
      entityId: result.entityId,
      totalResolved: result.totalResolved,
      filters: {
        days: filters.days,
        precision: filters.precision,
      },
      clusters: result.clusters,
      count: result.clusters.length,
    },
  });
});

/**
 * @desc    Get AI classification statistics
 * @route   GET /api/v1/complaints/ai-stats
 * @access  Public
 */
const getAIStats = asyncHandler(async (req, res) => {
  const stats = await complaintService.getAIStats();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: stats,
  });
});

/**
 * Format complaint for API response
 */
const formatComplaintResponse = (complaint) => {
  return {
    id: complaint._id,
    complaintId: complaint.complaintId,
    description: complaint.description,
    category: {
      primary: complaint.category.primary,
      subcategory: complaint.category.subcategory,
      urgency: complaint.category.urgency,
      keywords: complaint.category.keywords,
      source: complaint.category.classificationSource,
      needsReview: complaint.category.needsReview,
    },
    status: complaint.status.current,
    statusHistory: complaint.status.history,
    severity: {
      score: complaint.severity.score,
      priority: complaint.severity.priority,
      factors: complaint.severity.factors,
    },
    location: {
      coordinates: complaint.location.coordinates,
      address: complaint.location.address,
      area: complaint.location.area,
      ward: complaint.location.ward,
      pincode: complaint.location.pincode,
    },
    citizenInfo: {
      name: complaint.citizenInfo?.name || 'Anonymous',
      phone: maskPhone(complaint.citizenInfo?.phone),
      email: complaint.citizenInfo?.email ? maskEmail(complaint.citizenInfo.email) : null,
    },
    images: complaint.images?.map((img) => ({
      url: img.url,
    })) || [],
    source: complaint.source,
    assignedTo: complaint.assignedTo,
    resolution: complaint.resolution,
    duplicateOf: complaint.duplicateOf,
    aiProcessing: complaint.metadata?.aiProcessing || null,
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
  };
};

/**
 * Mask phone number for privacy
 */
const maskPhone = (phone) => {
  if (!phone) return null;
  if (phone.length <= 4) return phone;
  return phone.slice(0, 2) + '*'.repeat(phone.length - 4) + phone.slice(-2);
};

/**
 * Mask email for privacy
 */
const maskEmail = (email) => {
  if (!email) return null;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return email;
  return local[0] + '*'.repeat(local.length - 2) + local.slice(-1) + '@' + domain;
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  getStats,
  getHeatmap,
  getGlobalHeatmap,
  getProfileHeatmap,
  getAIStats,
};
