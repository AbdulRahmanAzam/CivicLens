const mongoose = require('mongoose');

/**
 * WhatsApp User Schema
 * Tracks users who interact only via WhatsApp without formal website registration
 * Maintains complaint history, preferences, and session data
 */
const whatsappUserSchema = new mongoose.Schema({
  // WhatsApp phone number (unique identifier)
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    index: true,
    trim: true,
  },
  
  // Display name from WhatsApp profile
  displayName: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  
  // Language preference (detected or set)
  language: {
    type: String,
    enum: ['en', 'hi', 'ur'],
    default: 'en',
  },
  
  // User status
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // Block status (for spam/abuse prevention)
  isBlocked: {
    type: Boolean,
    default: false,
  },
  blockedAt: Date,
  blockedReason: String,
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  // Location data (from last shared location)
  lastKnownLocation: {
    latitude: Number,
    longitude: Number,
    address: String,
    ucId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UC',
    },
    townId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Town',
    },
    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'City',
    },
    updatedAt: Date,
  },
  
  // Complaints statistics
  stats: {
    totalComplaints: { type: Number, default: 0 },
    pendingComplaints: { type: Number, default: 0 },
    resolvedComplaints: { type: Number, default: 0 },
    avgFeedbackRating: { type: Number, default: 0 },
    lastComplaintAt: Date,
  },
  
  // Complaint IDs (for quick reference)
  complaints: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
  }],
  
  // Session tracking
  sessions: {
    total: { type: Number, default: 0 },
    active: { type: Boolean, default: false },
    lastSessionAt: Date,
  },
  
  // Notification preferences
  notifications: {
    statusUpdates: { type: Boolean, default: true },
    resolutionAlerts: { type: Boolean, default: true },
    feedbackRequests: { type: Boolean, default: true },
    promotions: { type: Boolean, default: false },
  },
  
  // Interaction history (last N interactions)
  recentActivity: [{
    type: {
      type: String,
      enum: ['complaint_created', 'complaint_updated', 'feedback_given', 'message_sent', 'session_started'],
    },
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
    },
    description: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // First interaction
  firstInteractionAt: {
    type: Date,
    default: Date.now,
  },
  
  // Last active
  lastActiveAt: {
    type: Date,
    default: Date.now,
  },
  
  // Optional: Link to full User account if they later register
  linkedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  linkedAt: Date,
  
  // Metadata
  metadata: {
    source: { type: String, default: 'whatsapp' },
    deviceInfo: String,
    appVersion: String,
  },
}, {
  timestamps: true,
});

// Indexes (phone is already indexed via unique: true on the field)
whatsappUserSchema.index({ isActive: 1, isBlocked: 1 });
whatsappUserSchema.index({ 'lastKnownLocation.ucId': 1 });
whatsappUserSchema.index({ lastActiveAt: -1 });
whatsappUserSchema.index({ linkedUserId: 1 });

/**
 * Static: Find or create WhatsApp user by phone
 */
whatsappUserSchema.statics.findOrCreate = async function(phone, displayName = null) {
  let user = await this.findOne({ phone });
  
  if (!user) {
    user = await this.create({
      phone,
      displayName: displayName || 'WhatsApp User',
      firstInteractionAt: new Date(),
    });
    console.log(`[WhatsAppUser] Created new user: ${phone}`);
  } else {
    // Update display name if provided and different
    if (displayName && displayName !== user.displayName) {
      user.displayName = displayName;
    }
    user.lastActiveAt = new Date();
    await user.save();
  }
  
  return user;
};

/**
 * Instance: Add complaint reference
 */
whatsappUserSchema.methods.addComplaint = async function(complaintId) {
  if (!this.complaints.includes(complaintId)) {
    this.complaints.push(complaintId);
    this.stats.totalComplaints += 1;
    this.stats.pendingComplaints += 1;
    this.stats.lastComplaintAt = new Date();
    
    // Add to recent activity
    this.recentActivity.unshift({
      type: 'complaint_created',
      complaintId,
      timestamp: new Date(),
    });
    
    // Keep only last 20 activities
    if (this.recentActivity.length > 20) {
      this.recentActivity = this.recentActivity.slice(0, 20);
    }
    
    await this.save();
  }
  return this;
};

/**
 * Instance: Update complaint status
 */
whatsappUserSchema.methods.updateComplaintStatus = async function(complaintId, newStatus) {
  if (newStatus === 'resolved' || newStatus === 'closed') {
    this.stats.pendingComplaints = Math.max(0, this.stats.pendingComplaints - 1);
    this.stats.resolvedComplaints += 1;
    
    this.recentActivity.unshift({
      type: 'complaint_updated',
      complaintId,
      description: `Complaint ${newStatus}`,
      timestamp: new Date(),
    });
    
    if (this.recentActivity.length > 20) {
      this.recentActivity = this.recentActivity.slice(0, 20);
    }
    
    await this.save();
  }
  return this;
};

/**
 * Instance: Update location
 */
whatsappUserSchema.methods.updateLocation = async function(locationData) {
  this.lastKnownLocation = {
    ...locationData,
    updatedAt: new Date(),
  };
  await this.save();
  return this;
};

/**
 * Instance: Block user
 */
whatsappUserSchema.methods.block = async function(blockedBy, reason = '') {
  this.isBlocked = true;
  this.blockedAt = new Date();
  this.blockedBy = blockedBy;
  this.blockedReason = reason;
  await this.save();
  return this;
};

/**
 * Instance: Unblock user
 */
whatsappUserSchema.methods.unblock = async function() {
  this.isBlocked = false;
  this.blockedAt = undefined;
  this.blockedBy = undefined;
  this.blockedReason = undefined;
  await this.save();
  return this;
};

/**
 * Instance: Link to full User account
 */
whatsappUserSchema.methods.linkToUser = async function(userId) {
  this.linkedUserId = userId;
  this.linkedAt = new Date();
  await this.save();
  
  // Update the User model with WhatsApp phone
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(userId, {
    phone: this.phone,
    'notifications.whatsapp': true,
  });
  
  return this;
};

/**
 * Static: Get statistics
 */
whatsappUserSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
        },
        blockedUsers: {
          $sum: { $cond: [{ $eq: ['$isBlocked', true] }, 1, 0] },
        },
        linkedUsers: {
          $sum: { $cond: [{ $ne: ['$linkedUserId', null] }, 1, 0] },
        },
        totalComplaints: { $sum: '$stats.totalComplaints' },
      },
    },
  ]);
  
  return stats[0] || {
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    linkedUsers: 0,
    totalComplaints: 0,
  };
};

/**
 * Static: Find users by UC
 */
whatsappUserSchema.statics.findByUC = function(ucId) {
  return this.find({
    'lastKnownLocation.ucId': ucId,
    isActive: true,
    isBlocked: false,
  }).sort({ lastActiveAt: -1 });
};

/**
 * Static: Search users
 */
whatsappUserSchema.statics.search = function(query, options = {}) {
  const searchQuery = {};
  
  if (query.phone) {
    searchQuery.phone = { $regex: query.phone, $options: 'i' };
  }
  if (query.displayName) {
    searchQuery.displayName = { $regex: query.displayName, $options: 'i' };
  }
  if (query.isBlocked !== undefined) {
    searchQuery.isBlocked = query.isBlocked;
  }
  
  return this.find(searchQuery)
    .sort({ lastActiveAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

const WhatsAppUser = mongoose.model('WhatsAppUser', whatsappUserSchema);

module.exports = WhatsAppUser;
