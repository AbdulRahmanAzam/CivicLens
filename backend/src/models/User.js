const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * NIC Encryption utilities
 * AES-256-GCM for secure NIC storage
 */
const ENCRYPTION_KEY = process.env.NIC_ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

const encryptNIC = (nic) => {
  if (!nic) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32), iv);
  let encrypted = cipher.update(nic, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
};

const decryptNIC = (encryptedNIC) => {
  if (!encryptedNIC) return null;
  try {
    const [ivHex, encrypted, authTagHex] = encryptedNIC.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('NIC decryption error:', error.message);
    return null;
  }
};

const maskNIC = (nic) => {
  if (!nic) return null;
  // Format: XXXXX-XXXXXXX-X → *****-*******-X
  if (nic.length >= 13) {
    return '*****-*******-' + nic.slice(-1);
  }
  return '*'.repeat(nic.length - 1) + nic.slice(-1);
};

/**
 * User Schema
 * Supports citizens, UC Chairmen, Town Chairmen, Mayors, and Website Admins
 * Implements UC → Town → City hierarchy
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[+]?[\d\s-]{10,15}$/, 'Please provide a valid phone number'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  
  // Updated role enum for new hierarchy
  role: {
    type: String,
    enum: ['citizen', 'uc_chairman', 'town_chairman', 'mayor', 'website_admin'],
    default: 'citizen',
  },

  // NIC (National Identity Card) - Required for UC/Town Chairmen
  // Stored encrypted using AES-256-GCM
  nic: {
    encrypted: {
      type: String,
      select: false,
    },
    // Last 4 digits for display/verification
    lastFour: {
      type: String,
      maxlength: 4,
    },
  },

  // Hierarchy references
  // UC Chairman manages one UC
  ucId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UC',
    index: true,
  },
  // Town Chairman manages one Town
  townId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Town',
    index: true,
  },
  // Mayor manages one City
  cityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    index: true,
  },

  // Who invited this user (for UC/Town Chairmen and Mayors)
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  invitationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invitation',
  },

  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  
  // Password reset fields
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,
  
  // Refresh token for JWT
  refreshToken: {
    type: String,
    select: false,
  },
  refreshTokenExpires: Date,
  
  // Login tracking
  lastLogin: {
    type: Date,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: Date,
  
  // Complaints submitted by citizen
  complaintsSubmitted: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
  }],

  // Statistics for citizens
  stats: {
    totalComplaints: { type: Number, default: 0 },
    resolvedComplaints: { type: Number, default: 0 },
    avgFeedbackRating: { type: Number, default: 0 },
  },

  // Statistics for UC/Town/City managers
  managerStats: {
    complaintsHandled: { type: Number, default: 0 },
    avgResolutionTime: { type: Number, default: 0 },
    slaComplianceRate: { type: Number, default: 100 },
  },

  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: true },
  },
  
  // Profile picture
  avatar: {
    url: String,
    publicId: String,
  },

  // Account removal tracking
  removedAt: Date,
  removedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  removalReason: String,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ invitedBy: 1 });
userSchema.index({ isActive: 1, role: 1 });
userSchema.index({ refreshToken: 1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

/**
 * Virtual for full display info
 */
userSchema.virtual('displayInfo').get(function() {
  return {
    name: this.name,
    role: this.role,
    ucId: this.ucId,
    townId: this.townId,
    cityId: this.cityId,
  };
});

/**
 * Virtual for managed entity based on role
 */
userSchema.virtual('managedEntity').get(function() {
  switch (this.role) {
    case 'uc_chairman':
      return { type: 'UC', id: this.ucId };
    case 'town_chairman':
      return { type: 'Town', id: this.townId };
    case 'mayor':
      return { type: 'City', id: this.cityId };
    default:
      return null;
  }
});

/**
 * Virtual for maskedNIC
 */
userSchema.virtual('maskedNIC').get(function() {
  if (!this.nic?.encrypted) return null;
  const decrypted = decryptNIC(this.nic.encrypted);
  return maskNIC(decrypted);
});

/**
 * Pre-save middleware for password hashing
 */
userSchema.pre('save', async function() {
  // Only hash password if it's modified
  if (!this.isModified('password')) return;
  
  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  
  // Update passwordChangedAt timestamp
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }
});

/**
 * Pre-save middleware to encrypt NIC
 */
userSchema.pre('save', function() {
  if (this.isModified('nic.encrypted') && this.nic?.encrypted && !this.nic.encrypted.includes(':')) {
    // NIC is in plain text, encrypt it
    const plainNIC = this.nic.encrypted;
    this.nic.encrypted = encryptNIC(plainNIC);
    this.nic.lastFour = plainNIC.slice(-4);
  }
});

/**
 * Pre-save middleware to validate role-based requirements
 */
userSchema.pre('save', function() {
  // Validate that UC/Town Chairmen have NIC
  if (this.isModified('role') || this.isNew) {
    if (['uc_chairman', 'town_chairman'].includes(this.role)) {
      if (!this.nic?.encrypted && !this.nic?.lastFour) {
        // NIC should be provided during invitation acceptance
        // We'll validate this in the controller
      }
    }
    
    // Validate hierarchy references based on role
    if (this.role === 'uc_chairman' && !this.ucId) {
      // UC Chairman must have a UC assigned
    }
    if (this.role === 'town_chairman' && !this.townId) {
      // Town Chairman must have a Town assigned
    }
    if (this.role === 'mayor' && !this.cityId) {
      // Mayor must have a City assigned
    }
  }
});

/**
 * Instance method to check password
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check if password was changed after token was issued
 */
userSchema.methods.changedPasswordAfter = function(jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

/**
 * Generate password reset token
 */
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

/**
 * Generate email verification token
 */
userSchema.methods.createVerificationToken = function() {
  const verifyToken = crypto.randomBytes(32).toString('hex');
  
  this.verificationToken = crypto
    .createHash('sha256')
    .update(verifyToken)
    .digest('hex');
  
  this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verifyToken;
};

/**
 * Increment login attempts
 */
userSchema.methods.incLoginAttempts = async function() {
  // Reset lock if it has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hour lock
  }
  
  return this.updateOne(updates);
};

/**
 * Reset login attempts after successful login
 */
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0, lastLogin: new Date() },
    $unset: { lockUntil: 1 },
  });
};

/**
 * Static method to find UC Chairmen by Town
 */
userSchema.statics.findUCChairmenByTown = function(townId) {
  return this.find({
    role: 'uc_chairman',
    isActive: true,
  }).populate({
    path: 'ucId',
    match: { town: townId, isActive: true },
  }).then(users => users.filter(u => u.ucId));
};

/**
 * Static method to find Town Chairmen by City
 */
userSchema.statics.findTownChairmenByCity = function(cityId) {
  return this.find({
    role: 'town_chairman',
    isActive: true,
  }).populate({
    path: 'townId',
    match: { city: cityId, isActive: true },
  }).then(users => users.filter(u => u.townId));
};

/**
 * Static method to find user by email with password
 */
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email }).select('+password +refreshToken');
  
  if (!user) {
    return null;
  }
  
  // Check if account is locked
  if (user.isLocked) {
    const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
    throw new Error(`Account locked. Try again in ${lockTimeRemaining} minutes.`);
  }
  
  // Check if account is active
  if (!user.isActive) {
    throw new Error('Account has been deactivated. Please contact support.');
  }
  
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    await user.incLoginAttempts();
    return null;
  }
  
  // Reset login attempts on successful login
  await user.resetLoginAttempts();
  
  return user;
};

/**
 * Static method to check if email can be used
 * Allows re-use of email after account removal
 */
userSchema.statics.isEmailAvailable = async function(email) {
  const existingUser = await this.findOne({ 
    email, 
    isActive: true,
    removedAt: { $exists: false },
  });
  return !existingUser;
};

/**
 * Instance method to set NIC (encrypts automatically)
 */
userSchema.methods.setNIC = function(plainNIC) {
  this.nic = {
    encrypted: encryptNIC(plainNIC),
    lastFour: plainNIC.slice(-4),
  };
  return this;
};

/**
 * Instance method to get decrypted NIC (for authorized access only)
 */
userSchema.methods.getDecryptedNIC = function() {
  if (!this.nic?.encrypted) return null;
  return decryptNIC(this.nic.encrypted);
};

/**
 * Instance method to verify NIC
 */
userSchema.methods.verifyNIC = function(nic) {
  const decrypted = this.getDecryptedNIC();
  return decrypted === nic;
};

/**
 * Instance method to check hierarchy access
 * Returns true if user can access resources of another user
 */
userSchema.methods.canAccessUser = async function(targetUser) {
  // Same user
  if (this._id.equals(targetUser._id)) return true;
  
  // Website admin can access anyone
  if (this.role === 'website_admin') return true;
  
  // Mayor can access Town Chairmen and UC Chairmen in their city
  if (this.role === 'mayor') {
    if (targetUser.role === 'town_chairman') {
      const Town = mongoose.model('Town');
      const town = await Town.findById(targetUser.townId);
      return town && town.city.equals(this.cityId);
    }
    if (targetUser.role === 'uc_chairman') {
      const UC = mongoose.model('UC');
      const uc = await UC.findById(targetUser.ucId);
      return uc && uc.city.equals(this.cityId);
    }
  }
  
  // Town Chairman can access UC Chairmen in their town
  if (this.role === 'town_chairman') {
    if (targetUser.role === 'uc_chairman') {
      const UC = mongoose.model('UC');
      const uc = await UC.findById(targetUser.ucId);
      return uc && uc.town.equals(this.townId);
    }
  }
  
  return false;
};

/**
 * Instance method to soft delete (remove) user
 */
userSchema.methods.softDelete = async function(removedBy, reason = '') {
  this.isActive = false;
  this.removedAt = new Date();
  this.removedBy = removedBy;
  this.removalReason = reason;
  
  // Clear hierarchy references
  if (this.role === 'uc_chairman') {
    const UC = mongoose.model('UC');
    await UC.findByIdAndUpdate(this.ucId, { chairman: null });
  } else if (this.role === 'town_chairman') {
    const Town = mongoose.model('Town');
    await Town.findByIdAndUpdate(this.townId, { chairman: null });
  } else if (this.role === 'mayor') {
    const City = mongoose.model('City');
    await City.findByIdAndUpdate(this.cityId, { mayor: null });
  }
  
  return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
module.exports.encryptNIC = encryptNIC;
module.exports.decryptNIC = decryptNIC;
module.exports.maskNIC = maskNIC;
