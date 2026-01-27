/**
 * Invitation Controller
 * Handles admin role invitation CRUD and acceptance
 */

const invitationService = require('../services/invitationService');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Create a new invitation
 * @route   POST /api/invitations
 * @access  Website Admin (all roles), Mayor (town_chairman, uc_chairman), Town Chairman (uc_chairman)
 */
exports.createInvitation = asyncHandler(async (req, res, next) => {
  const { email, role, targetEntityId } = req.body;

  // Validate required fields
  if (!email || !role || !targetEntityId) {
    return next(new ErrorResponse('Email, role, and targetEntityId are required', 400));
  }

  // Check permissions based on inviter's role
  const allowedRolesMap = {
    website_admin: ['mayor', 'town_chairman', 'uc_chairman'],
    mayor: ['town_chairman', 'uc_chairman'],
    town_chairman: ['uc_chairman'],
  };

  const allowedRoles = allowedRolesMap[req.user.role];
  if (!allowedRoles || !allowedRoles.includes(role)) {
    return next(new ErrorResponse(`You are not authorized to invite users for the ${role} role`, 403));
  }

  // For mayor: verify target entity is in their city
  if (req.user.role === 'mayor') {
    // This will be validated in the service, but we do a preliminary check here
    const { Town, UC } = require('../models');
    
    if (role === 'town_chairman') {
      const town = await Town.findById(targetEntityId);
      if (!town || town.city.toString() !== req.user.city?.toString()) {
        return next(new ErrorResponse('Not authorized to invite chairmen for this town', 403));
      }
    } else if (role === 'uc_chairman') {
      const uc = await UC.findById(targetEntityId);
      if (!uc || uc.city.toString() !== req.user.city?.toString()) {
        return next(new ErrorResponse('Not authorized to invite chairmen for this UC', 403));
      }
    }
  }

  // For town chairman: verify target UC is in their town
  if (req.user.role === 'town_chairman' && role === 'uc_chairman') {
    const { UC } = require('../models');
    const uc = await UC.findById(targetEntityId);
    if (!uc || uc.town.toString() !== req.user.town?.toString()) {
      return next(new ErrorResponse('Not authorized to invite chairmen for this UC', 403));
    }
  }

  try {
    const result = await invitationService.createInvitation(
      {
        email,
        role,
        invitedBy: req.user._id,
        targetEntityId,
      },
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }
    );

    res.status(201).json({
      success: true,
      message: 'Invitation created successfully',
      data: result,
    });
  } catch (error) {
    return next(new ErrorResponse(error.message, 400));
  }
});

/**
 * @desc    Validate an invitation token
 * @route   GET /api/invitations/validate/:token
 * @access  Public
 */
exports.validateToken = asyncHandler(async (req, res, next) => {
  const { token } = req.params;

  if (!token) {
    return next(new ErrorResponse('Token is required', 400));
  }

  const result = await invitationService.validateToken(token);

  if (!result.valid) {
    return next(new ErrorResponse(result.error, 400));
  }

  res.status(200).json({
    success: true,
    data: result.invitation,
  });
});

/**
 * @desc    Accept an invitation and register
 * @route   POST /api/invitations/accept
 * @access  Public
 */
exports.acceptInvitation = asyncHandler(async (req, res, next) => {
  const { token, name, email, password, nic } = req.body;

  // Validate required fields
  if (!token || !name || !email || !password) {
    return next(new ErrorResponse('Token, name, email, and password are required', 400));
  }

  // Password strength check
  if (password.length < 8) {
    return next(new ErrorResponse('Password must be at least 8 characters long', 400));
  }

  try {
    const result = await invitationService.acceptInvitation(
      token,
      { name, email, password, nic },
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }
    );

    // Generate tokens for the new user
    const { User } = require('../models');
    const user = await User.findById(result.user.id);
    const accessToken = user.getSignedJwtToken();
    const refreshToken = user.getRefreshToken();

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: result.user,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    return next(new ErrorResponse(error.message, 400));
  }
});

/**
 * @desc    Get pending invitations
 * @route   GET /api/invitations
 * @access  Website Admin, Mayor (own city), Town Chairman (own town)
 */
exports.getPendingInvitations = asyncHandler(async (req, res, next) => {
  const filters = {};

  // Filter based on user role
  if (req.user.role === 'mayor') {
    filters.cityId = req.user.city;
  } else if (req.user.role === 'town_chairman') {
    filters.townId = req.user.town;
  }

  // Additional query filters
  if (req.query.role) {
    filters.role = req.query.role;
  }

  const invitations = await invitationService.getPendingInvitations(filters);

  res.status(200).json({
    success: true,
    count: invitations.length,
    data: invitations,
  });
});

/**
 * @desc    Get a single invitation
 * @route   GET /api/invitations/:id
 * @access  Website Admin, Mayor (own city), Town Chairman (own town)
 */
exports.getInvitation = asyncHandler(async (req, res, next) => {
  const { Invitation } = require('../models');
  
  const invitation = await Invitation.findById(req.params.id)
    .populate('invitedBy', 'name email')
    .populate('targetUC', 'name code')
    .populate('targetTown', 'name code')
    .populate('targetCity', 'name code');

  if (!invitation) {
    return next(new ErrorResponse('Invitation not found', 404));
  }

  // Check permissions
  if (req.user.role === 'mayor' && 
      invitation.targetCity?._id?.toString() !== req.user.city?.toString()) {
    return next(new ErrorResponse('Not authorized to view this invitation', 403));
  }
  if (req.user.role === 'town_chairman' && 
      invitation.targetTown?._id?.toString() !== req.user.town?.toString()) {
    return next(new ErrorResponse('Not authorized to view this invitation', 403));
  }

  res.status(200).json({
    success: true,
    data: invitation,
  });
});

/**
 * @desc    Revoke an invitation
 * @route   DELETE /api/invitations/:id
 * @access  Website Admin, Mayor (own city), Town Chairman (own town)
 */
exports.revokeInvitation = asyncHandler(async (req, res, next) => {
  const { Invitation } = require('../models');
  
  const invitation = await Invitation.findById(req.params.id);
  if (!invitation) {
    return next(new ErrorResponse('Invitation not found', 404));
  }

  // Check permissions
  if (req.user.role === 'mayor' && 
      invitation.targetCity?.toString() !== req.user.city?.toString()) {
    return next(new ErrorResponse('Not authorized to revoke this invitation', 403));
  }
  if (req.user.role === 'town_chairman' && 
      invitation.targetTown?.toString() !== req.user.town?.toString()) {
    return next(new ErrorResponse('Not authorized to revoke this invitation', 403));
  }

  try {
    await invitationService.revokeInvitation(
      req.params.id,
      req.user._id,
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }
    );

    res.status(200).json({
      success: true,
      message: 'Invitation revoked successfully',
    });
  } catch (error) {
    return next(new ErrorResponse(error.message, 400));
  }
});

/**
 * @desc    Resend an invitation
 * @route   POST /api/invitations/:id/resend
 * @access  Website Admin, Mayor (own city), Town Chairman (own town)
 */
exports.resendInvitation = asyncHandler(async (req, res, next) => {
  const { Invitation } = require('../models');
  
  const invitation = await Invitation.findById(req.params.id);
  if (!invitation) {
    return next(new ErrorResponse('Invitation not found', 404));
  }

  // Check permissions
  if (req.user.role === 'mayor' && 
      invitation.targetCity?.toString() !== req.user.city?.toString()) {
    return next(new ErrorResponse('Not authorized to resend this invitation', 403));
  }
  if (req.user.role === 'town_chairman' && 
      invitation.targetTown?.toString() !== req.user.town?.toString()) {
    return next(new ErrorResponse('Not authorized to resend this invitation', 403));
  }

  try {
    const result = await invitationService.resendInvitation(
      req.params.id,
      req.user._id,
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }
    );

    res.status(200).json({
      success: true,
      message: 'Invitation resent successfully',
      data: result,
    });
  } catch (error) {
    return next(new ErrorResponse(error.message, 400));
  }
});

/**
 * @desc    Get invitation statistics
 * @route   GET /api/invitations/stats
 * @access  Website Admin
 */
exports.getInvitationStats = asyncHandler(async (req, res, next) => {
  const { Invitation } = require('../models');
  
  const stats = await Invitation.aggregate([
    {
      $group: {
        _id: { status: '$status', role: '$role' },
        count: { $sum: 1 },
      },
    },
  ]);

  // Organize stats
  const organized = {
    byStatus: {},
    byRole: {},
    total: 0,
  };

  stats.forEach(stat => {
    // By status
    if (!organized.byStatus[stat._id.status]) {
      organized.byStatus[stat._id.status] = 0;
    }
    organized.byStatus[stat._id.status] += stat.count;

    // By role
    if (!organized.byRole[stat._id.role]) {
      organized.byRole[stat._id.role] = { total: 0, byStatus: {} };
    }
    organized.byRole[stat._id.role].total += stat.count;
    organized.byRole[stat._id.role].byStatus[stat._id.status] = stat.count;

    organized.total += stat.count;
  });

  // Count expired (pending but past expiry)
  const expiredCount = await Invitation.countDocuments({
    status: 'pending',
    expiresAt: { $lt: new Date() },
  });

  res.status(200).json({
    success: true,
    data: {
      ...organized,
      expiredPending: expiredCount,
    },
  });
});

/**
 * @desc    Cleanup expired invitations
 * @route   POST /api/invitations/cleanup
 * @access  Website Admin
 */
exports.cleanupExpired = asyncHandler(async (req, res, next) => {
  const result = await invitationService.cleanupExpired();

  res.status(200).json({
    success: true,
    message: `Cleaned up ${result.expiredCount} expired invitations`,
    data: result,
  });
});
