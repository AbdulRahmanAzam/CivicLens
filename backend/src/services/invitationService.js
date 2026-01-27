/**
 * Invitation Service
 * Handles admin role invitation tokens with 24-hour expiry
 */

const crypto = require('crypto');
const { Invitation, User, UC, Town, City, AuditLog } = require('../models');

class InvitationService {
  /**
   * Create a new invitation for an admin role
   * 
   * @param {Object} params - Invitation parameters
   * @param {string} params.email - Invitee's email address
   * @param {string} params.role - Role to invite for (uc_chairman, town_chairman, mayor)
   * @param {string} params.invitedBy - User ID of the inviter
   * @param {string} params.targetEntityId - UC/Town/City ID based on role
   * @param {Object} options - Additional options
   * @returns {Object} Invitation result with token (only shown once)
   */
  async createInvitation({ email, role, invitedBy, targetEntityId }, options = {}) {
    console.log(`[Invitation] Creating invitation for ${email} as ${role}`);

    // Validate role is an admin role
    const validRoles = ['uc_chairman', 'town_chairman', 'mayor'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role for invitation: ${role}. Valid roles: ${validRoles.join(', ')}`);
    }

    // Check if email already has an active invitation for this role
    const existingInvitation = await Invitation.findOne({
      email: email.toLowerCase(),
      role,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });

    if (existingInvitation) {
      throw new Error(`An active invitation already exists for ${email} as ${role}`);
    }

    // Check if user already exists with this role
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
      role,
    });

    if (existingUser) {
      throw new Error(`User with email ${email} already has the ${role} role`);
    }

    // Validate target entity based on role
    const entityValidation = await this.validateTargetEntity(role, targetEntityId);
    if (!entityValidation.valid) {
      throw new Error(entityValidation.error);
    }

    // Check if entity already has a chairman/mayor assigned
    const entityOccupied = await this.checkEntityOccupied(role, targetEntityId);
    if (entityOccupied.occupied) {
      throw new Error(entityOccupied.error);
    }

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = this.hashToken(rawToken);

    // Calculate expiry (24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Build invitation object
    const invitationData = {
      email: email.toLowerCase(),
      role,
      token: hashedToken,
      expiresAt,
      invitedBy,
      status: 'pending',
    };

    // Add entity reference based on role
    switch (role) {
      case 'uc_chairman':
        invitationData.targetUC = targetEntityId;
        invitationData.targetTown = entityValidation.entity.town;
        invitationData.targetCity = entityValidation.entity.city;
        break;
      case 'town_chairman':
        invitationData.targetTown = targetEntityId;
        invitationData.targetCity = entityValidation.entity.city;
        break;
      case 'mayor':
        invitationData.targetCity = targetEntityId;
        break;
    }

    // Create invitation
    const invitation = await Invitation.create(invitationData);

    // Log the action
    await AuditLog.logAction({
      action: 'invitation_created',
      actor: invitedBy,
      target: {
        type: 'invitation',
        id: invitation._id,
      },
      details: {
        email,
        role,
        targetEntity: targetEntityId,
        expiresAt,
      },
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    });

    console.log(`[Invitation] Created invitation ${invitation._id} for ${email}`);

    return {
      invitation: {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        targetEntity: entityValidation.entity.name,
      },
      // Raw token only returned once - must be sent to invitee
      token: rawToken,
      registrationLink: this.generateRegistrationLink(rawToken),
    };
  }

  /**
   * Validate an invitation token
   */
  async validateToken(rawToken) {
    const hashedToken = this.hashToken(rawToken);

    const invitation = await Invitation.findOne({
      token: hashedToken,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    })
      .populate('targetUC', 'name code')
      .populate('targetTown', 'name code')
      .populate('targetCity', 'name code')
      .populate('invitedBy', 'name email');

    if (!invitation) {
      return {
        valid: false,
        error: 'Invalid or expired invitation token',
      };
    }

    return {
      valid: true,
      invitation: {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        invitedBy: invitation.invitedBy?.name || 'System',
        targetEntity: this.getTargetEntityFromInvitation(invitation),
      },
    };
  }

  /**
   * Accept an invitation and create user account
   */
  async acceptInvitation(rawToken, userData, options = {}) {
    console.log(`[Invitation] Accepting invitation with token`);

    // Validate token
    const validation = await this.validateToken(rawToken);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const hashedToken = this.hashToken(rawToken);
    const invitation = await Invitation.findOne({ token: hashedToken });

    // Check email matches
    if (invitation.email !== userData.email.toLowerCase()) {
      throw new Error('Email does not match invitation');
    }

    // Build user data based on role
    const newUserData = {
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: userData.password,
      role: invitation.role,
      invitedBy: invitation.invitedBy,
      invitationToken: hashedToken,
      invitationAcceptedAt: new Date(),
    };

    // Add NIC for chairman roles
    if (['uc_chairman', 'town_chairman', 'mayor'].includes(invitation.role)) {
      if (!userData.nic) {
        throw new Error('NIC is required for administrative roles');
      }
      newUserData.nicEncrypted = userData.nic; // Will be encrypted by pre-save hook
    }

    // Add entity references
    if (invitation.targetUC) newUserData.uc = invitation.targetUC;
    if (invitation.targetTown) newUserData.town = invitation.targetTown;
    if (invitation.targetCity) newUserData.city = invitation.targetCity;

    // Create user
    const user = await User.create(newUserData);

    // Update entity with chairman/mayor reference
    await this.assignUserToEntity(invitation.role, user._id, invitation);

    // Mark invitation as accepted
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();

    // Log the action
    await AuditLog.logAction({
      action: 'invitation_accepted',
      actor: user._id,
      target: {
        type: 'invitation',
        id: invitation._id,
      },
      details: {
        email: user.email,
        role: user.role,
      },
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    });

    console.log(`[Invitation] User ${user._id} created from invitation`);

    return {
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Revoke an invitation
   */
  async revokeInvitation(invitationId, revokedBy, options = {}) {
    const invitation = await Invitation.findById(invitationId);

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new Error(`Cannot revoke invitation with status: ${invitation.status}`);
    }

    invitation.status = 'revoked';
    invitation.revokedBy = revokedBy;
    invitation.revokedAt = new Date();
    await invitation.save();

    // Log the action
    await AuditLog.logAction({
      action: 'invitation_revoked',
      actor: revokedBy,
      target: {
        type: 'invitation',
        id: invitation._id,
      },
      details: {
        email: invitation.email,
        role: invitation.role,
      },
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    });

    return { success: true };
  }

  /**
   * Resend an invitation (creates new token, extends expiry)
   */
  async resendInvitation(invitationId, resentBy, options = {}) {
    const invitation = await Invitation.findById(invitationId);

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new Error(`Cannot resend invitation with status: ${invitation.status}`);
    }

    // Generate new token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = this.hashToken(rawToken);

    // Update invitation
    invitation.token = hashedToken;
    invitation.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    invitation.resentCount = (invitation.resentCount || 0) + 1;
    invitation.lastResentAt = new Date();
    await invitation.save();

    // Log the action
    await AuditLog.logAction({
      action: 'invitation_resent',
      actor: resentBy,
      target: {
        type: 'invitation',
        id: invitation._id,
      },
      details: {
        email: invitation.email,
        role: invitation.role,
        resentCount: invitation.resentCount,
      },
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    });

    return {
      invitation: {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
      token: rawToken,
      registrationLink: this.generateRegistrationLink(rawToken),
    };
  }

  /**
   * Get pending invitations
   */
  async getPendingInvitations(filters = {}) {
    const query = {
      status: 'pending',
      expiresAt: { $gt: new Date() },
    };

    if (filters.role) query.role = filters.role;
    if (filters.cityId) query.targetCity = filters.cityId;
    if (filters.townId) query.targetTown = filters.townId;

    const invitations = await Invitation.find(query)
      .populate('invitedBy', 'name email')
      .populate('targetUC', 'name code')
      .populate('targetTown', 'name code')
      .populate('targetCity', 'name code')
      .sort({ createdAt: -1 });

    return invitations.map(inv => ({
      id: inv._id,
      email: inv.email,
      role: inv.role,
      expiresAt: inv.expiresAt,
      invitedBy: inv.invitedBy?.name || 'System',
      targetEntity: this.getTargetEntityFromInvitation(inv),
      createdAt: inv.createdAt,
      expiresIn: this.getExpiresInText(inv.expiresAt),
    }));
  }

  /**
   * Clean up expired invitations
   */
  async cleanupExpired() {
    const result = await Invitation.updateMany(
      {
        status: 'pending',
        expiresAt: { $lt: new Date() },
      },
      {
        status: 'expired',
      }
    );

    console.log(`[Invitation] Cleaned up ${result.modifiedCount} expired invitations`);
    return { expiredCount: result.modifiedCount };
  }

  // =====================
  // Helper Methods
  // =====================

  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  generateRegistrationLink(token) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${baseUrl}/register?token=${token}`;
  }

  async validateTargetEntity(role, entityId) {
    switch (role) {
      case 'uc_chairman': {
        const uc = await UC.findById(entityId).populate('town').populate('city');
        if (!uc) return { valid: false, error: 'UC not found' };
        if (!uc.isActive) return { valid: false, error: 'UC is not active' };
        return { valid: true, entity: uc };
      }
      case 'town_chairman': {
        const town = await Town.findById(entityId).populate('city');
        if (!town) return { valid: false, error: 'Town not found' };
        if (!town.isActive) return { valid: false, error: 'Town is not active' };
        return { valid: true, entity: town };
      }
      case 'mayor': {
        const city = await City.findById(entityId);
        if (!city) return { valid: false, error: 'City not found' };
        if (!city.isActive) return { valid: false, error: 'City is not active' };
        return { valid: true, entity: city };
      }
      default:
        return { valid: false, error: 'Invalid role' };
    }
  }

  async checkEntityOccupied(role, entityId) {
    switch (role) {
      case 'uc_chairman': {
        const uc = await UC.findById(entityId);
        if (uc?.chairman) {
          const chairman = await User.findById(uc.chairman);
          if (chairman) {
            return { 
              occupied: true, 
              error: `UC already has a chairman: ${chairman.name}` 
            };
          }
        }
        return { occupied: false };
      }
      case 'town_chairman': {
        const town = await Town.findById(entityId);
        if (town?.townChairman) {
          const chairman = await User.findById(town.townChairman);
          if (chairman) {
            return { 
              occupied: true, 
              error: `Town already has a chairman: ${chairman.name}` 
            };
          }
        }
        return { occupied: false };
      }
      case 'mayor': {
        const city = await City.findById(entityId);
        if (city?.mayor) {
          const mayor = await User.findById(city.mayor);
          if (mayor) {
            return { 
              occupied: true, 
              error: `City already has a mayor: ${mayor.name}` 
            };
          }
        }
        return { occupied: false };
      }
      default:
        return { occupied: false };
    }
  }

  async assignUserToEntity(role, userId, invitation) {
    switch (role) {
      case 'uc_chairman':
        await UC.findByIdAndUpdate(invitation.targetUC, { chairman: userId });
        break;
      case 'town_chairman':
        await Town.findByIdAndUpdate(invitation.targetTown, { townChairman: userId });
        break;
      case 'mayor':
        await City.findByIdAndUpdate(invitation.targetCity, { mayor: userId });
        break;
    }
  }

  getTargetEntityFromInvitation(invitation) {
    if (invitation.targetUC) {
      return {
        type: 'uc',
        id: invitation.targetUC._id || invitation.targetUC,
        name: invitation.targetUC.name,
        code: invitation.targetUC.code,
      };
    }
    if (invitation.targetTown) {
      return {
        type: 'town',
        id: invitation.targetTown._id || invitation.targetTown,
        name: invitation.targetTown.name,
        code: invitation.targetTown.code,
      };
    }
    if (invitation.targetCity) {
      return {
        type: 'city',
        id: invitation.targetCity._id || invitation.targetCity,
        name: invitation.targetCity.name,
        code: invitation.targetCity.code,
      };
    }
    return null;
  }

  getExpiresInText(expiresAt) {
    const diff = expiresAt - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}

module.exports = new InvitationService();
