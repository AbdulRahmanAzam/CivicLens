const mongoose = require('mongoose');
const { generateComplaintId } = require('../utils/helpers');

/**
 * Status history sub-schema
 */
const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['reported', 'acknowledged', 'in_progress', 'resolved', 'closed', 'rejected'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: String,
    default: 'system',
  },
  remarks: String,
}, { _id: false });

/**
 * Citizen info sub-schema
 */
const citizenInfoSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[+]?[\d\s-]{10,15}$/, 'Please provide a valid phone number'],
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
}, { _id: false });

/**
 * Image sub-schema
 */
const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  publicId: String,
  analysis: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { _id: false });

/**
 * Resolution sub-schema
 */
const resolutionSchema = new mongoose.Schema({
  description: String,
  resolvedAt: Date,
  resolvedBy: String,
  citizenFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: String,
    feedbackAt: Date,
  },
}, { _id: false });

/**
 * Severity sub-schema
 */
const severitySchema = new mongoose.Schema({
  score: {
    type: Number,
    min: 1,
    max: 10,
    default: 5,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  factors: {
    frequency: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    categoryUrgency: { type: Number, default: 0 },
    areaImpact: { type: Number, default: 0 },
    citizenUrgency: { type: Number, default: 0 },
  },
}, { _id: false });

/**
 * Main Complaint Schema
 */
const complaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    unique: true,
    index: true,
  },
  citizenInfo: {
    type: citizenInfoSchema,
    required: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  category: {
    primary: {
      type: String,
      enum: ['Roads', 'Water', 'Garbage', 'Electricity', 'Others'],
      default: 'Others',
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    keywords: [{
      type: String,
      trim: true,
    }],
    classificationSource: {
      type: String,
      enum: ['groq', 'local', 'manual', 'default'],
      default: 'local',
    },
    needsReview: {
      type: Boolean,
      default: false,
    },
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Location coordinates are required'],
      validate: {
        validator: function(coords) {
          if (!coords || coords.length !== 2) return false;
          const [lng, lat] = coords;
          return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
        },
        message: 'Invalid coordinates. Longitude must be -180 to 180, Latitude must be -90 to 90',
      },
    },
    address: {
      type: String,
      trim: true,
    },
    area: {
      type: String,
      trim: true,
    },
    ward: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
  },
  images: {
    type: [imageSchema],
    validate: {
      validator: function(images) {
        return images.length <= 5;
      },
      message: 'Maximum 5 images allowed per complaint',
    },
  },
  source: {
    type: String,
    enum: ['web', 'mobile', 'whatsapp', 'voice'],
    default: 'web',
  },
  status: {
    current: {
      type: String,
      enum: ['reported', 'acknowledged', 'in_progress', 'resolved', 'closed', 'rejected'],
      default: 'reported',
    },
    history: [statusHistorySchema],
  },
  severity: {
    type: severitySchema,
    default: () => ({}),
  },
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
  },
  linkedComplaints: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resolution: {
    type: resolutionSchema,
    default: null,
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    voiceTranscript: String,
    aiProcessing: {
      classificationTime: Number,
      duplicateCheckDetails: mongoose.Schema.Types.Mixed,
      severityDetails: mongoose.Schema.Types.Mixed,
      processedAt: Date,
    },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

/**
 * Indexes for optimized queries
 */
// Geospatial index for location-based queries
complaintSchema.index({ 'location': '2dsphere' });
// Category index for filtering
complaintSchema.index({ 'category.primary': 1 });
// Status index for filtering
complaintSchema.index({ 'status.current': 1 });
// Created date for sorting (descending for recent first)
complaintSchema.index({ createdAt: -1 });
// Severity score for sorting
complaintSchema.index({ 'severity.score': -1 });
// Compound index for area-category queries
complaintSchema.index({ 'location.area': 1, 'category.primary': 1 });
// Text index for search
complaintSchema.index({ description: 'text', 'location.address': 'text' });

/**
 * Pre-save middleware to generate complaintId
 */
complaintSchema.pre('save', async function(next) {
  if (this.isNew && !this.complaintId) {
    this.complaintId = await generateComplaintId();
    
    // Initialize status history with 'reported' status
    if (!this.status.history || this.status.history.length === 0) {
      this.status.history = [{
        status: 'reported',
        timestamp: new Date(),
        updatedBy: 'system',
        remarks: 'Complaint submitted',
      }];
    }
  }
  next();
});

/**
 * Static method to find complaints near a location
 */
complaintSchema.statics.findNearby = function(longitude, latitude, maxDistance = 1000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance,
      },
    },
  });
};

/**
 * Static method to get statistics
 */
complaintSchema.statics.getStats = async function(filters = {}) {
  const matchStage = {};
  
  if (filters.dateFrom) {
    matchStage.createdAt = { $gte: new Date(filters.dateFrom) };
  }
  if (filters.dateTo) {
    matchStage.createdAt = { ...matchStage.createdAt, $lte: new Date(filters.dateTo) };
  }
  if (filters.area) {
    matchStage['location.area'] = filters.area;
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $facet: {
        total: [{ $count: 'count' }],
        byCategory: [
          { $group: { _id: '$category.primary', count: { $sum: 1 } } },
        ],
        byStatus: [
          { $group: { _id: '$status.current', count: { $sum: 1 } } },
        ],
        byArea: [
          { $group: { _id: '$location.area', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
        avgResolutionTime: [
          {
            $match: {
              'status.current': { $in: ['resolved', 'closed'] },
              'resolution.resolvedAt': { $exists: true },
            },
          },
          {
            $project: {
              resolutionTime: {
                $divide: [
                  { $subtract: ['$resolution.resolvedAt', '$createdAt'] },
                  3600000, // Convert to hours
                ],
              },
            },
          },
          { $group: { _id: null, avgTime: { $avg: '$resolutionTime' } } },
        ],
      },
    },
  ]);

  return stats[0];
};

/**
 * Instance method to update status
 */
complaintSchema.methods.updateStatus = async function(newStatus, updatedBy, remarks = '') {
  // Valid status transitions
  const validTransitions = {
    reported: ['acknowledged', 'rejected'],
    acknowledged: ['in_progress', 'rejected'],
    in_progress: ['resolved', 'rejected'],
    resolved: ['closed'],
    closed: [],
    rejected: [],
  };

  const currentStatus = this.status.current;
  
  if (!validTransitions[currentStatus].includes(newStatus)) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
  }

  this.status.current = newStatus;
  this.status.history.push({
    status: newStatus,
    timestamp: new Date(),
    updatedBy,
    remarks,
  });

  // If resolved, set resolution timestamp
  if (newStatus === 'resolved') {
    if (!this.resolution) {
      this.resolution = {};
    }
    this.resolution.resolvedAt = new Date();
    this.resolution.resolvedBy = updatedBy;
  }

  return this.save();
};

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;
