const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Invitation Schema
 * Manages invitations for UC Chairmen, Town Chairmen, and Mayors
 * Features: 24-hour expiry, single-use tokens, role-based creation
 * 
 * Updated to support both service patterns:
 * - `role` and `targetRole` (same field)
 * - Separate `targetUC`, `targetTown`, `targetCity` fields
 * - `token` stores hashed value directly (service hashes before saving)
 */
const invitationSchema = new mongoose.Schema({
  // Hashed invitation token (service hashes before saving)
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  // Email address of invitee
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  // Role the invitee will have after registration
  // Service uses 'role', keeping for compatibility
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['uc_chairman', 'town_chairman', 'mayor'],
  },
  
  // Separate entity references (service pattern)
  targetUC: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UC',
  },
  targetTown: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Town',
  },
  targetCity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
  },
  
  // Who created this invitation
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Inviter is required'],
  },
  
  // Invitation status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired', 'revoked'],
    default: 'pending',
  },
  
  // Expiration time (24 hours from creation)
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
  
  // When the invitation was used
  acceptedAt: {
    type: Date,
  },
  
  // User created from this invitation
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  // Who revoked (if revoked)
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  revokedAt: {
    type: Date,
  },
  
  // Resend tracking
  resentCount: {
    type: Number,
    default: 0,
  },
  lastResentAt: {
    type: Date,
  },
  
  // Invitation message (optional)
  message: {
    type: String,
    maxlength: [500, 'Message cannot exceed 500 characters'],
  },
}, {
  timestamps: true,
});

// Indexes
invitationSchema.index({ email: 1, status: 1 });
invitationSchema.index({ invitedBy: 1 });
invitationSchema.index({ targetUC: 1 });
invitationSchema.index({ targetTown: 1 });
invitationSchema.index({ targetCity: 1 });
invitationSchema.index({ status: 1, expiresAt: 1 });
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

/**
 * Instance method to check if invitation is valid
 */
invitationSchema.methods.isValid = function() {
  return (
    this.status === 'pending' &&
    this.expiresAt > new Date()
  );
};

/**
 * Instance method to mark invitation as accepted
 */
invitationSchema.methods.accept = async function(userId) {
  if (!this.isValid()) {
    throw new Error('Invitation is no longer valid');
  }

  this.status = 'accepted';
  this.acceptedAt = new Date();
  this.acceptedBy = userId;

  return this.save();
};

/**
 * Instance method to revoke invitation
 */
invitationSchema.methods.revoke = async function(revokedByUserId) {
  if (this.status !== 'pending') {
    throw new Error('Can only revoke pending invitations');
  }

  this.status = 'revoked';
  this.revokedBy = revokedByUserId;
  this.revokedAt = new Date();
  return this.save();
};

/**
 * Instance method to resend invitation (update expiry)
 */
invitationSchema.methods.resend = async function() {
  if (this.status !== 'pending' && this.status !== 'expired') {
    throw new Error('Cannot resend this invitation');
  }

  // Generate new token (service will hash it)
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.token = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  // Reset expiry
  this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  this.status = 'pending';
  this.resentCount = (this.resentCount || 0) + 1;
  this.lastResentAt = new Date();

  await this.save();
  return rawToken; // Return raw token for email
};

/**
 * Static method to create invitation with validation
 * Simplified to match InvitationService usage
 */
invitationSchema.statics.createInvitation = async function({
  email,
  role,
  targetUC,
  targetTown,
  targetCity,
  invitedBy,
  message,
}) {
  // Check for existing pending invitation to same email
  const existingQuery = {
    email,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  };
  
  // Add entity filter based on role
  if (role === 'uc_chairman' && targetUC) {
    existingQuery.targetUC = targetUC;
  } else if (role === 'town_chairman' && targetTown) {
    existingQuery.targetTown = targetTown;
  } else if (role === 'mayor' && targetCity) {
    existingQuery.targetCity = targetCity;
  }

  const existing = await this.findOne(existingQuery);

  if (existing) {
    throw new Error('An active invitation already exists for this email and entity');
  }

  // Generate token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  // Create invitation
  const invitation = new this({
    token: hashedToken,
    email,
    role,
    targetUC,
    targetTown,
    targetCity,
    invitedBy,
    message,
  });

  await invitation.save();
  
  // Return both invitation and raw token for email
  return { invitation, rawToken };
};

/**
 * Static method to find valid invitation by token
 * Note: Token should be hashed before calling if using raw token from URL
 */
invitationSchema.statics.findByToken = async function(token, hashIt = true) {
  let searchToken = token;
  
  // Hash if it's a raw token
  if (hashIt) {
    searchToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }

  const invitation = await this.findOne({
    token: searchToken,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  }).populate('invitedBy', 'name email role');

  return invitation;
};

/**
 * Static method to find all invitations by inviter
 */
invitationSchema.statics.findByInviter = function(inviterId, options = {}) {
  const query = { invitedBy: inviterId };
  
  if (options.status) {
    query.status = options.status;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('acceptedBy', 'name email');
};

/**
 * Static method to find all invitations for an entity
 */
invitationSchema.statics.findByEntity = function(entityId, entityType, options = {}) {
  const query = {};
  
  // Set the correct entity field based on type
  if (entityType === 'uc') {
    query.targetUC = entityId;
  } else if (entityType === 'town') {
    query.targetTown = entityId;
  } else if (entityType === 'city') {
    query.targetCity = entityId;
  }
  
  if (options.status) {
    query.status = options.status;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('invitedBy', 'name email role')
    .populate('acceptedBy', 'name email');
};

/**
 * Static method to cleanup expired invitations
 */
invitationSchema.statics.cleanupExpired = async function() {
  const result = await this.updateMany(
    {
      status: 'pending',
      expiresAt: { $lt: new Date() },
    },
    {
      $set: { status: 'expired' },
    }
  );

  return result.modifiedCount;
};

/**
 * Static method to get invitation statistics
 */
invitationSchema.statics.getStats = async function(options = {}) {
  const matchStage = {};
  
  if (options.inviterId) {
    matchStage.invitedBy = new mongoose.Types.ObjectId(options.inviterId);
  }
  
  if (options.since) {
    matchStage.createdAt = { $gte: new Date(options.since) };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        byStatus: {
          $push: { status: '$_id', count: '$count' },
        },
      },
    },
  ]);
};

const Invitation = mongoose.model('Invitation', invitationSchema);

module.exports = Invitation;
