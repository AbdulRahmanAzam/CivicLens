/**
 * Authentication Controller
 * Handles user registration, login, logout, password reset, and profile management
 */

const User = require('../models/User');
const authService = require('../services/authService');
const emailService = require('../services/emailService');
const { asyncHandler, AppError } = require('../middlewares/errorHandler');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, confirmPassword } = req.body;
  
  console.log('🔵 Registration attempt:', { email, name, phone });
  
  // Check if passwords match
  if (password !== confirmPassword) {
    console.log('❌ Password mismatch for:', email);
    throw new AppError('Passwords do not match', HTTP_STATUS.BAD_REQUEST);
  }
  
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    console.log('❌ User already exists:', email);
    throw new AppError('Email already registered', HTTP_STATUS.CONFLICT);
  }
  
  // Create user
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: 'citizen', // Default role
  });
  
  console.log('✅ User created successfully:', { id: user._id, email: user.email });
  
  // Generate tokens
  const tokens = await authService.generateTokenPair(user);
  
  // Generate verification token (for email verification)
  const { verifyToken } = await authService.generateVerificationToken(user._id);
  
  // Send verification email
  try {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verifyToken}`;
    
    await emailService.sendEmail({
      to: user.email,
      subject: 'CivicLens - Verify Your Email Address',
      html: `
        <h2>Welcome to CivicLens, ${user.name}!</h2>
        <p>Thank you for registering. Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email
        </a>
        <p>If you didn't register for this account, please ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
      `
    });
    
    console.log('✅ Verification email sent to:', user.email);
  } catch (emailError) {
    console.log('⚠️ Failed to send verification email:', emailError.message);
    // Don't fail registration if email fails, just log the error
  }
  
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Registration successful. Please verify your email.',
    data: {
      user: formatUserResponse(user),
      tokens,
      // Include verifyToken only in development
      ...(process.env.NODE_ENV === 'development' && { verifyToken }),
    },
  });
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  console.log('🔵 Login attempt:', email);
  
  // Validate input
  if (!email || !password) {
    throw new AppError('Please provide email and password', HTTP_STATUS.BAD_REQUEST);
  }
  
  // Find user and check credentials
  const user = await User.findByCredentials(email, password);
  
  if (!user) {
    console.log('❌ Invalid login credentials for:', email);
    throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
  }
  
  console.log('✅ Login successful:', { id: user._id, email: user.email, role: user.role });
  
  // Generate tokens
  const tokens = await authService.generateTokenPair(user);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Login successful',
    data: {
      user: formatUserResponse(user),
      tokens,
    },
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // Invalidate refresh token
  await authService.invalidateRefreshToken(req.user._id);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * @desc    Logout from all devices
 * @route   POST /api/v1/auth/logout-all
 * @access  Private
 */
const logoutAll = asyncHandler(async (req, res) => {
  // Invalidate all sessions
  await authService.invalidateAllSessions(req.user._id);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Logged out from all devices successfully',
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw new AppError('Refresh token is required', HTTP_STATUS.BAD_REQUEST);
  }
  
  const result = await authService.refreshAccessToken(refreshToken);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      accessTokenExpires: result.accessTokenExpires,
    },
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      user: formatUserResponse(user),
    },
  });
});

/**
 * @desc    Update user profile
 * @route   PATCH /api/v1/auth/me
 * @access  Private
 */
const updateMe = asyncHandler(async (req, res) => {
  // Fields allowed to be updated
  const allowedFields = ['name', 'phone', 'notifications', 'avatar'];
  const updates = {};
  
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  );
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: formatUserResponse(user),
    },
  });
});

/**
 * @desc    Change password
 * @route   PATCH /api/v1/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  
  // Validate input
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new AppError('Please provide all required fields', HTTP_STATUS.BAD_REQUEST);
  }
  
  if (newPassword !== confirmPassword) {
    throw new AppError('New passwords do not match', HTTP_STATUS.BAD_REQUEST);
  }
  
  // Get user with password
  const user = await User.findById(req.user._id).select('+password');
  
  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', HTTP_STATUS.UNAUTHORIZED);
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  // Generate new tokens (invalidate old sessions)
  const tokens = await authService.generateTokenPair(user);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Password changed successfully',
    data: {
      tokens,
    },
  });
});

/**
 * @desc    Request password reset
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  console.log('🔵 Password reset request for:', email);
  
  if (!email) {
    throw new AppError('Please provide your email', HTTP_STATUS.BAD_REQUEST);
  }
  
  const result = await authService.generatePasswordResetToken(email);
  
  // Send password reset email if user exists
  if (result && result.resetToken) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${result.resetToken}`;
      
      await emailService.sendEmail({
        to: email,
        subject: 'CivicLens - Password Reset Request',
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password for your CivicLens account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
          <p>If you didn't request this, please ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        `
      });
      
      console.log('✅ Password reset email sent to:', email);
    } catch (emailError) {
      console.log('⚠️ Failed to send password reset email:', emailError.message);
      // Don't fail the request if email fails, just log the error
    }
  } else {
    console.log('⚠️ Password reset requested for non-existent email:', email);
  }
  
  // Always return success to prevent email enumeration
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'If the email exists, a password reset link has been sent.',
    // Include reset token only in development
    ...(process.env.NODE_ENV === 'development' && result && { resetToken: result.resetToken }),
  });
});

/**
 * @desc    Reset password with token
 * @route   POST /api/v1/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;
  
  console.log('🔵 Password reset attempt with token:', token);
  
  if (!password || !confirmPassword) {
    throw new AppError('Please provide password and confirmation', HTTP_STATUS.BAD_REQUEST);
  }
  
  if (password !== confirmPassword) {
    console.log('❌ Password mismatch during reset');
    throw new AppError('Passwords do not match', HTTP_STATUS.BAD_REQUEST);
  }
  
  await authService.resetPasswordWithToken(token, password);
  
  console.log('✅ Password reset successful');
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Password reset successful. Please login with your new password.',
  });
});

/**
 * @desc    Verify email
 * @route   GET /api/v1/auth/verify-email/:token
 * @access  Public
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  
  await authService.verifyEmailWithToken(token);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Email verified successfully',
  });
});

/**
 * @desc    Resend verification email
 * @route   POST /api/v1/auth/resend-verification
 * @access  Private
 */
const resendVerification = asyncHandler(async (req, res) => {
  if (req.user.isVerified) {
    throw new AppError('Email is already verified', HTTP_STATUS.BAD_REQUEST);
  }
  
  const { verifyToken } = await authService.generateVerificationToken(req.user._id);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Verification email sent',
    // Include token only in development
    ...(process.env.NODE_ENV === 'development' && { verifyToken }),
  });
});

/**
 * @desc    Delete own account
 * @route   DELETE /api/v1/auth/me
 * @access  Private
 */
const deleteMe = asyncHandler(async (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    throw new AppError('Please provide your password to confirm deletion', HTTP_STATUS.BAD_REQUEST);
  }
  
  // Verify password
  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    throw new AppError('Incorrect password', HTTP_STATUS.UNAUTHORIZED);
  }
  
  // Soft delete - deactivate account
  await User.findByIdAndUpdate(req.user._id, {
    isActive: false,
    email: `deleted_${Date.now()}_${user.email}`, // Prevent email reuse issues
  });
  
  // Invalidate all sessions
  await authService.invalidateAllSessions(req.user._id);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Account deleted successfully',
  });
});

// ==================== ADMIN OPERATIONS ====================

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/v1/auth/users
 * @access  Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, isActive, search } = req.query;
  
  const query = {};
  
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  
  const users = await User.find(query)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
  
  const total = await User.countDocuments(query);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      users: users.map(formatUserResponse),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * @desc    Get single user (admin only)
 * @route   GET /api/v1/auth/users/:id
 * @access  Private/Admin
 */
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      user: formatUserResponse(user),
    },
  });
});

/**
 * @desc    Update user (admin only)
 * @route   PATCH /api/v1/auth/users/:id
 * @access  Private/Admin
 */
const updateUser = asyncHandler(async (req, res) => {
  const { role, isActive, isVerified, department, ward, area } = req.body;
  
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }
  
  // Prevent modifying superadmin
  if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
    throw new AppError('Cannot modify superadmin account', HTTP_STATUS.FORBIDDEN);
  }
  
  // Update fields
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  if (isVerified !== undefined) user.isVerified = isVerified;
  if (department !== undefined) user.department = department;
  if (ward !== undefined) user.ward = ward;
  if (area !== undefined) user.area = area;
  
  await user.save({ validateBeforeSave: false });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'User updated successfully',
    data: {
      user: formatUserResponse(user),
    },
  });
});

/**
 * @desc    Delete user (admin only)
 * @route   DELETE /api/v1/auth/users/:id
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }
  
  // Prevent deleting superadmin
  if (user.role === 'superadmin') {
    throw new AppError('Cannot delete superadmin account', HTTP_STATUS.FORBIDDEN);
  }
  
  // Prevent self-deletion through this route
  if (user._id.equals(req.user._id)) {
    throw new AppError('Use /auth/me endpoint to delete your own account', HTTP_STATUS.BAD_REQUEST);
  }
  
  // Soft delete
  await User.findByIdAndUpdate(user._id, {
    isActive: false,
    email: `deleted_${Date.now()}_${user.email}`,
  });
  
  // Invalidate sessions
  await authService.invalidateAllSessions(user._id);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'User deleted successfully',
  });
});

/**
 * @desc    Create user (admin only) - for creating officers/supervisors
 * @route   POST /api/v1/auth/users
 * @access  Private/Admin
 */
const createUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, department, ward, area } = req.body;
  
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already registered', HTTP_STATUS.CONFLICT);
  }
  
  // Only superadmin can create admin users
  if (role === 'admin' && req.user.role !== 'superadmin') {
    throw new AppError('Only superadmin can create admin users', HTTP_STATUS.FORBIDDEN);
  }
  
  // Cannot create superadmin
  if (role === 'superadmin') {
    throw new AppError('Cannot create superadmin users', HTTP_STATUS.FORBIDDEN);
  }
  
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: role || 'citizen',
    department,
    ward,
    area,
    isVerified: true, // Admin-created users are pre-verified
  });
  
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'User created successfully',
    data: {
      user: formatUserResponse(user),
    },
  });
});

// ==================== HELPERS ====================

/**
 * Format user object for API response
 */
const formatUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  department: user.department,
  ward: user.ward,
  area: user.area,
  isActive: user.isActive,
  isVerified: user.isVerified,
  avatar: user.avatar,
  stats: user.stats,
  notifications: user.notifications,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

module.exports = {
  // Public
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  
  // Private (authenticated users)
  logout,
  logoutAll,
  getMe,
  updateMe,
  changePassword,
  resendVerification,
  deleteMe,
  
  // Admin only
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  createUser,
};
