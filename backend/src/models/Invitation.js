const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Invitation Schema
 * Manages invitations for UC Chairmen, Town Chairmen, and Mayors
 * Features: 24-hour expiry, single-use tokens, role-based creation
 */
const invitationSchema = new mongoose.Schema({
  // Unique invitation token (crypto-secure)
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  // Hashed token for secure storage
  tokenHash: {
    type: String,
    required: true,
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
  targetRole: {
    type: String,
    required: [true, 'Target role is required'],
    enum: ['uc_chairman', 'town_chairman', 'mayor'],
  },
  // Reference to entity they'll manage
  targetEntity: {
    type: {
      type: String,
      enum: ['uc', 'town', 'city'],
      required: true,
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'targetEntity.model',
    },
    model: {
      type: String,
      enum: ['UC', 'Town', 'City'],
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
  },
  // Who created this invitation
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Inviter is required'],
  },
  inviterRole: {
    type: String,
    enum: ['town_chairman', 'mayor', 'website_admin'],
    required: true,
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
    index: { expires: 0 }, // TTL index for automatic cleanup
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
  // Invitation message (optional)
  message: {
    type: String,
    maxlength: [500, 'Message cannot exceed 500 characters'],
  },
  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    acceptedIp: String,
    acceptedUserAgent: String,
    resendCount: { type: Number, default: 0 },
    lastResendAt: Date,
  },
}, {
  timestamps: true,
});

// Indexes
invitationSchema.index({ email: 1, status: 1 });
invitationSchema.index({ invitedBy: 1 });
invitationSchema.index({ 'targetEntity.id': 1 });
invitationSchema.index({ status: 1, expiresAt: 1 });

/**
 * Pre-save middleware to generate token and hash
 */
invitationSchema.pre('save', function(next) {
  if (this.isNew) {
    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    this.token = rawToken;
    
    // Store a hash of the token
    this.tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
  }
  next();
});

/**
 * Pre-save middleware to set target entity model based on role
 */
invitationSchema.pre('save', function(next) {
  if (this.isModified('targetRole') || this.isNew) {
    switch (this.targetRole) {
      case 'uc_chairman':
        this.targetEntity.type = 'uc';
        this.targetEntity.model = 'UC';
        break;
      case 'town_chairman':
        this.targetEntity.type = 'town';
        this.targetEntity.model = 'Town';
        break;
      case 'mayor':
        this.targetEntity.type = 'city';
        this.targetEntity.model = 'City';
        break;
    }
  }
  next();
});

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
invitationSchema.methods.accept = async function(userId, metadata = {}) {
  if (!this.isValid()) {
    throw new Error('Invitation is no longer valid');
  }

  this.status = 'accepted';
  this.acceptedAt = new Date();
  this.acceptedBy = userId;
  this.metadata.acceptedIp = metadata.ipAddress;
  this.metadata.acceptedUserAgent = metadata.userAgent;

  return this.save();
};

/**
 * Instance method to revoke invitation
 */
invitationSchema.methods.revoke = async function() {
  if (this.status !== 'pending') {
    throw new Error('Can only revoke pending invitations');
  }

  this.status = 'revoked';
  return this.save();
};

/**
 * Instance method to resend invitation (update expiry)
 */
invitationSchema.methods.resend = async function() {
  if (this.status !== 'pending' && this.status !== 'expired') {
    throw new Error('Cannot resend this invitation');
  }

  // Generate new token
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.token = rawToken;
  this.tokenHash = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  // Reset expiry
  this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  this.status = 'pending';
  this.metadata.resendCount = (this.metadata.resendCount || 0) + 1;
  this.metadata.lastResendAt = new Date();

  return this.save();
};

/**
 * Static method to create invitation with validation
 */
invitationSchema.statics.createInvitation = async function({
  email,
  targetRole,
  targetEntityId,
  invitedBy,
  inviterRole,
  message,
  metadata,
}) {
  // Validate inviter can create this type of invitation
  const validCreators = {
    uc_chairman: ['town_chairman'],
    town_chairman: ['mayor'],
    mayor: ['website_admin'],
  };

  if (!validCreators[targetRole].includes(inviterRole)) {
    throw new Error(`${inviterRole} cannot invite ${targetRole}`);
  }

  // Check for existing pending invitation to same email for same entity
  const existing = await this.findOne({
    email,
    'targetEntity.id': targetEntityId,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  });

  if (existing) {
    throw new Error('An active invitation already exists for this email and entity');
  }

  // Get entity name
  let entityName = '';
  let entityModel = '';
  
  switch (targetRole) {
    case 'uc_chairman':
      entityModel = 'UC';
      const UC = mongoose.model('UC');
      const uc = await UC.findById(targetEntityId);
      if (!uc) throw new Error('UC not found');
      entityName = uc.name;
      break;
    case 'town_chairman':
      entityModel = 'Town';
      const Town = mongoose.model('Town');
      const town = await Town.findById(targetEntityId);
      if (!town) throw new Error('Town not found');
      entityName = town.name;
      break;
    case 'mayor':
      entityModel = 'City';
      const City = mongoose.model('City');
      const city = await City.findById(targetEntityId);
      if (!city) throw new Error('City not found');
      entityName = city.name;
      break;
  }

  // Create invitation
  const invitation = new this({
    email,
    targetRole,
    targetEntity: {
      id: targetEntityId,
      model: entityModel,
      name: entityName,
    },
    invitedBy,
    inviterRole,
    message,
    metadata,
  });

  await invitation.save();
  return invitation;
};

/**
 * Static method to find valid invitation by token
 */
invitationSchema.statics.findByToken = async function(token) {
  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const invitation = await this.findOne({
    tokenHash,
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
invitationSchema.statics.findByEntity = function(entityId, options = {}) {
  const query = { 'targetEntity.id': entityId };
  
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
    matchStage.invitedBy = mongoose.Types.ObjectId(options.inviterId);
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
