const { Complaint, Category } = require('../models');
const geoService = require('./geoService');
const cloudinaryService = require('./cloudinaryService');
const classificationService = require('./classificationService');
const duplicateService = require('./duplicateService');
const severityService = require('./severityService');
const {
  buildComplaintQuery,
  buildSortObject,
  getPaginationMeta,
  toGeoJSON,
  getDateRange,
} = require('../utils/helpers');
const { PAGINATION, GEO, TIME } = require('../utils/constants');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Complaint Service
 * Business logic for complaint operations
 */
class ComplaintService {
  /**
   * Create a new complaint
   * Full AI pipeline: Classification → Duplicate Detection → Severity Scoring
   */
  async createComplaint(data, files = []) {
    const {
      description,
      phone,
      name,
      email,
      latitude,
      longitude,
      address,
      source = 'web',
    } = data;

    console.log('[ComplaintService] Starting AI pipeline for new complaint...');

    // Get location details via reverse geocoding
    const location = await geoService.reverseGeocode(latitude, longitude);
    
    // Override with provided address if available
    if (address) {
      location.address = address;
    }

    // Upload images to cloud storage
    const images = [];
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const uploadResult = await cloudinaryService.uploadImage(file.buffer, {
            folder: 'civiclens/complaints',
          });
          images.push({
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            analysis: {},
          });
        } catch (error) {
          console.error('Image upload failed:', error.message);
          // Continue without the failed image
        }
      }
    }

    // Step 1: AI Classification (GROQ + local fallback)
    console.log('[AI Pipeline] Step 1: Classifying complaint...');
    const classification = await classificationService.classifyComplaint(description);
    console.log(`[AI Pipeline] Classified as: ${classification.category} (${classification.confidence} confidence, source: ${classification.source})`);

    // Step 2: Duplicate Detection (geo + text similarity)
    console.log('[AI Pipeline] Step 2: Checking for duplicates...');
    const duplicateCheck = await duplicateService.checkForDuplicates({
      description,
      longitude,
      latitude,
      category: classification.category,
    });
    console.log(`[AI Pipeline] Duplicate check: ${duplicateCheck.isDuplicate ? 'DUPLICATE FOUND' : 'No duplicates'}, ${duplicateCheck.nearbyCount} nearby complaints`);

    // Step 3: Severity Scoring (rule-based)
    console.log('[AI Pipeline] Step 3: Calculating severity...');
    const severity = await severityService.calculateSeverity({
      description,
      category: classification.category,
      longitude,
      latitude,
      reportedUrgency: classification.urgency,
    });
    console.log(`[AI Pipeline] Severity: ${severity.score}/10 (${severity.priority})`);

    // Create the complaint with AI-enriched data
    const complaint = new Complaint({
      citizenInfo: {
        name,
        phone,
        email,
      },
      description,
      category: {
        primary: classification.category,
        confidence: classification.confidence,
        subcategory: classification.subcategory,
        urgency: classification.urgency,
        keywords: classification.keywords,
        classificationSource: classification.source,
        needsReview: classification.needsReview,
      },
      location,
      images,
      source,
      severity: {
        score: severity.score,
        factors: severity.factors,
        priority: severity.priority,
      },
      duplicateOf: duplicateCheck.potentialDuplicate,
      metadata: {
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        aiProcessing: {
          classificationTime: classification.processingTime,
          duplicateCheckDetails: duplicateCheck.checkDetails,
          severityDetails: severity.details,
        },
      },
    });

    await complaint.save();

    // Link duplicates if found
    if (duplicateCheck.isDuplicate && duplicateCheck.potentialDuplicate) {
      await duplicateService.linkDuplicates(
        duplicateCheck.potentialDuplicate,
        complaint._id
      );
    }

    console.log(`[AI Pipeline] Complete! Complaint ${complaint.complaintId} created.`);

    return {
      complaint,
      classification,
      duplicateCheck,
      severity,
    };
  }

  /**
   * Get complaints with filters and pagination
   */
  async getComplaints(filters = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      lat,
      lng,
      radius = GEO.DEFAULT_RADIUS,
      sort_by,
      sort_order,
      ...otherFilters
    } = filters;

    // Build query
    let query = buildComplaintQuery(otherFilters);
    let complaints;
    let totalCount;

    // Handle geo-queries
    if (lat && lng) {
      // For geo-queries, we need to use $nearSphere
      query.location = {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: radius,
        },
      };
    }

    // Build sort
    const sort = buildSortObject(sort_by, sort_order);

    // Execute query with pagination
    const skip = (page - 1) * limit;

    // Get total count (without geo-sort)
    const countQuery = { ...query };
    if (countQuery.location && countQuery.location.$nearSphere) {
      // Convert to $geoWithin for counting
      countQuery.location = {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(lng), parseFloat(lat)],
            radius / 6371000, // Convert meters to radians
          ],
        },
      };
    }
    totalCount = await Complaint.countDocuments(countQuery);

    // Get complaints
    complaints = await Complaint.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'name department')
      .lean();

    // Generate pagination metadata
    const pagination = getPaginationMeta(page, limit, totalCount);

    return {
      complaints,
      pagination,
    };
  }

  /**
   * Get a single complaint by ID
   */
  async getComplaintById(id) {
    // Try to find by complaintId first, then by _id
    let complaint = await Complaint.findOne({ complaintId: id })
      .populate('assignedTo', 'name department')
      .populate('duplicateOf', 'complaintId description')
      .populate('linkedComplaints', 'complaintId description status.current');

    if (!complaint) {
      // Try ObjectId
      complaint = await Complaint.findById(id)
        .populate('assignedTo', 'name department')
        .populate('duplicateOf', 'complaintId description')
        .populate('linkedComplaints', 'complaintId description status.current');
    }

    if (!complaint) {
      throw new AppError('Complaint not found', 404);
    }

    return complaint;
  }

  /**
   * Update complaint status
   */
  async updateStatus(id, { status, remarks, updatedBy }) {
    const complaint = await this.getComplaintById(id);
    
    // Use the model's updateStatus method
    await complaint.updateStatus(status, updatedBy, remarks);

    return complaint;
  }

  /**
   * Get aggregated statistics
   */
  async getStats(filters = {}) {
    const stats = await Complaint.getStats(filters);

    // Process stats
    const processed = {
      totalComplaints: stats.total[0]?.count || 0,
      byCategory: {},
      byStatus: {},
      byArea: [],
      averageResolutionTime: stats.avgResolutionTime[0]?.avgTime || 0,
      todayCount: 0,
      weeklyTrend: [],
    };

    // Convert arrays to objects for easier consumption
    stats.byCategory.forEach((item) => {
      processed.byCategory[item._id || 'Unknown'] = item.count;
    });

    stats.byStatus.forEach((item) => {
      processed.byStatus[item._id || 'Unknown'] = item.count;
    });

    processed.byArea = stats.byArea.map((item) => ({
      area: item._id || 'Unknown',
      count: item.count,
    }));

    // Get today's count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    processed.todayCount = await Complaint.countDocuments({
      createdAt: { $gte: today },
    });

    // Get weekly trend
    processed.weeklyTrend = await this.getWeeklyTrend();

    return processed;
  }

  /**
   * Get weekly complaint trend
   */
  async getWeeklyTrend() {
    const { start } = getDateRange(7);

    const trend = await Complaint.aggregate([
      {
        $match: {
          createdAt: { $gte: start },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return trend.map((item) => ({
      date: item._id,
      count: item.count,
    }));
  }

  /**
   * Get heatmap data
   */
  async getHeatmapData(filters = {}) {
    const { category, days = TIME.DEFAULT_REPORT_DAYS } = filters;
    const { start } = getDateRange(days);

    const matchStage = {
      createdAt: { $gte: start },
    };

    if (category) {
      matchStage['category.primary'] = category;
    }

    // Aggregate complaints by location grid
    const clusters = await Complaint.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            // Round to 3 decimal places (~111m precision)
            lat: {
              $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 3],
            },
            lng: {
              $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 3],
            },
          },
          count: { $sum: 1 },
          categories: { $push: '$category.primary' },
          avgSeverity: { $avg: '$severity.score' },
        },
      },
      {
        $project: {
          _id: 0,
          lat: '$_id.lat',
          lng: '$_id.lng',
          count: 1,
          category: { $arrayElemAt: ['$categories', 0] },
          intensity: {
            $min: [{ $multiply: [{ $divide: ['$count', 10] }, '$avgSeverity'] }, 1],
          },
        },
      },
    ]);

    return clusters;
  }

  /**
   * Check for potential duplicate complaints
   * Uses the enhanced duplicate detection service
   */
  async checkDuplicates(longitude, latitude, description, category = null, radiusMeters = 500) {
    return duplicateService.checkForDuplicates(
      { description, longitude, latitude, category },
      { radius: radiusMeters }
    );
  }

  /**
   * Get AI processing statistics
   */
  async getAIStats() {
    const classificationStats = classificationService.getClassificationStats();
    const duplicateStats = await duplicateService.getDuplicateStats(30);
    const severityStats = await severityService.getSeverityStats(30);

    return {
      classification: classificationStats,
      duplicates: duplicateStats,
      severity: severityStats,
    };
  }

  /**
   * Recalculate severity for a complaint
   */
  async recalculateSeverity(complaintId) {
    return severityService.recalculateSeverity(complaintId);
  }

  /**
   * Reclassify a complaint
   */
  async reclassifyComplaint(complaintId) {
    const complaint = await this.getComplaintById(complaintId);
    
    const classification = await classificationService.classifyComplaint(complaint.description);
    
    complaint.category = {
      primary: classification.category,
      confidence: classification.confidence,
      subcategory: classification.subcategory,
      urgency: classification.urgency,
      keywords: classification.keywords,
      classificationSource: classification.source,
      needsReview: classification.needsReview,
    };
    
    await complaint.save();
    
    return { complaint, classification };
  }
}

module.exports = new ComplaintService();
