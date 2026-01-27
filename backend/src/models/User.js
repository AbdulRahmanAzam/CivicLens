const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * User Schema
 * Supports both citizens and administrative users
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
    select: false, // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['citizen', 'officer', 'supervisor', 'admin', 'superadmin'],
    default: 'citizen',
  },
  department: {
    type: String,
    trim: true,
  },
  ward: {
    type: String,
    trim: true,
  },
  area: {
    type: String,
    trim: true,
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
  
  complaintsSubmitted: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
  }],
  complaintsAssigned: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
  }],
  stats: {
    totalComplaints: { type: Number, default: 0 },
    resolvedComplaints: { type: Number, default: 0 },
    avgResolutionTime: { type: Number, default: 0 },
  },
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
  },
  
  // Profile picture
  avatar: {
    url: String,
    publicId: String,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
// Note: email already has unique index from field definition
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
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
    department: this.department,
  };
});

/**
 * Pre-save middleware for password hashing
 */
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) return next();
  
  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  
  // Update passwordChangedAt timestamp
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is created after
  }
  
  next();
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
 * Static method to find officers by department
 */
userSchema.statics.findByDepartment = function(department) {
  return this.find({
    department,
    role: { $in: ['officer', 'supervisor'] },
    isActive: true,
  });
};

/**
 * Static method to find by email with password
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

const User = mongoose.model('User', userSchema);

module.exports = User;
