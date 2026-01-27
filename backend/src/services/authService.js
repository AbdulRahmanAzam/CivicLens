/**
 * Authentication Service
 * Handles JWT token management, refresh tokens, and session management
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { jwt: jwtConfig } = require('../config/env');
const User = require('../models/User');

// Token configuration
const ACCESS_TOKEN_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_TOKEN_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

/**
 * Generate access token
 */
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role, type: 'access' },
    jwtConfig.secret,
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (userId) => {
  const refreshToken = jwt.sign(
    { id: userId, type: 'refresh' },
    jwtConfig.secret,
    { expiresIn: REFRESH_TOKEN_EXPIRES }
  );
  return refreshToken;
};

/**
 * Generate both access and refresh tokens
 */
const generateTokenPair = async (user) => {
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  
  // Store hashed refresh token in database
  const hashedRefreshToken = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');
  
  // Calculate refresh token expiry (7 days)
  const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  await User.findByIdAndUpdate(user._id, {
    refreshToken: hashedRefreshToken,
    refreshTokenExpires,
  });
  
  return {
    accessToken,
    refreshToken,
    accessTokenExpires: ACCESS_TOKEN_EXPIRES,
    refreshTokenExpires: REFRESH_TOKEN_EXPIRES,
  };
};

/**
 * Verify access token
 */
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid access token');
    }
    throw error;
  }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with this refresh token
    const user = await User.findOne({
      _id: decoded.id,
      refreshToken: hashedToken,
      refreshTokenExpires: { $gt: Date.now() },
    }).select('+refreshToken');
    
    if (!user) {
      throw new Error('Invalid refresh token');
    }
    
    return user;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    throw error;
  }
};

/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = async (refreshToken) => {
  const user = await verifyRefreshToken(refreshToken);
  
  // Generate new access token
  const accessToken = generateAccessToken(user._id, user.role);
  
  // Optionally rotate refresh token (recommended for security)
  const newRefreshToken = generateRefreshToken(user._id);
  
  const hashedRefreshToken = crypto
    .createHash('sha256')
    .update(newRefreshToken)
    .digest('hex');
  
  const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  await User.findByIdAndUpdate(user._id, {
    refreshToken: hashedRefreshToken,
    refreshTokenExpires,
  });
  
  return {
    accessToken,
    refreshToken: newRefreshToken,
    accessTokenExpires: ACCESS_TOKEN_EXPIRES,
    user,
  };
};

/**
 * Invalidate refresh token (logout)
 */
const invalidateRefreshToken = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $unset: { refreshToken: 1, refreshTokenExpires: 1 },
  });
};

/**
 * Invalidate all sessions for a user
 */
const invalidateAllSessions = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $unset: { refreshToken: 1, refreshTokenExpires: 1 },
    passwordChangedAt: Date.now(),
  });
};

/**
 * Generate password reset token
 */
const generatePasswordResetToken = async (email) => {
  const user = await User.findOne({ email });
  
  if (!user) {
    return null;
  }
  
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  
  return {
    user,
    resetToken,
    resetUrl: `${process.env.FRONTEND_URL}/reset-password/${resetToken}`,
  };
};

/**
 * Verify password reset token
 */
const verifyPasswordResetToken = async (token) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  
  return user;
};

/**
 * Reset password with token
 */
const resetPasswordWithToken = async (token, newPassword) => {
  const user = await verifyPasswordResetToken(token);
  
  if (!user) {
    throw new Error('Token is invalid or has expired');
  }
  
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  
  // Invalidate all existing sessions
  await invalidateAllSessions(user._id);
  
  return user;
};

/**
 * Generate email verification token
 */
const generateVerificationToken = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const verifyToken = user.createVerificationToken();
  await user.save({ validateBeforeSave: false });
  
  return {
    user,
    verifyToken,
    verifyUrl: `${process.env.FRONTEND_URL}/verify-email/${verifyToken}`,
  };
};

/**
 * Verify email with token
 */
const verifyEmailWithToken = async (token) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationTokenExpires: { $gt: Date.now() },
  });
  
  if (!user) {
    throw new Error('Token is invalid or has expired');
  }
  
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save({ validateBeforeSave: false });
  
  return user;
};

/**
 * Get user from token
 */
const getUserFromToken = async (token) => {
  const decoded = verifyAccessToken(token);
  const user = await User.findById(decoded.id);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Check if password was changed after token was issued
  if (user.changedPasswordAfter(decoded.iat)) {
    throw new Error('Password was changed. Please login again.');
  }
  
  return user;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  refreshAccessToken,
  invalidateRefreshToken,
  invalidateAllSessions,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  resetPasswordWithToken,
  generateVerificationToken,
  verifyEmailWithToken,
  getUserFromToken,
};
