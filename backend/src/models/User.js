const mongoose = require('mongoose');

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
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['citizen', 'officer', 'supervisor', 'admin'],
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
  lastLogin: {
    type: Date,
  },
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
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

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
 * Note: Implement actual hashing with bcrypt when adding authentication
 */
userSchema.pre('save', async function(next) {
  // Password hashing would go here
  // For now, we're just passing through
  // In production, use bcrypt:
  // if (this.isModified('password')) {
  //   const bcrypt = require('bcryptjs');
  //   this.password = await bcrypt.hash(this.password, 12);
  // }
  next();
});

/**
 * Instance method to check password
 * Note: Implement actual comparison with bcrypt when adding authentication
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  // In production, use bcrypt:
  // const bcrypt = require('bcryptjs');
  // return await bcrypt.compare(candidatePassword, this.password);
  return candidatePassword === this.password; // Temporary - NOT FOR PRODUCTION
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

const User = mongoose.model('User', userSchema);

module.exports = User;
