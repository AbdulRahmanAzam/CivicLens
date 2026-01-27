/**
 * Session Service
 * Manages WhatsApp conversation sessions
 * Uses MongoDB for persistence with TTL
 */

const WhatsAppSession = require('../models/WhatsAppSession');

class SessionService {
  /**
   * Get or create a session for a phone number
   * @param {string} phone - WhatsApp phone number
   * @param {Object} userInfo - User info from WhatsApp
   * @returns {Promise<Object>} Session document
   */
  async getOrCreateSession(phone, userInfo = {}) {
    return WhatsAppSession.findOrCreate(phone, userInfo);
  }

  /**
   * Get session by phone number
   * @param {string} phone - WhatsApp phone number
   * @returns {Promise<Object|null>} Session document
   */
  async getSession(phone) {
    return WhatsAppSession.findOne({ phone });
  }

  /**
   * Update session step
   * @param {string} phone - WhatsApp phone number
   * @param {string} step - New step
   * @returns {Promise<Object>} Updated session
   */
  async updateStep(phone, step) {
    const session = await this.getSession(phone);
    if (!session) {
      throw new Error('Session not found');
    }
    return session.updateStep(step);
  }

  /**
   * Add message to session history
   * @param {string} phone - WhatsApp phone number
   * @param {string} direction - 'incoming' or 'outgoing'
   * @param {string} type - Message type
   * @param {string} content - Message content
   * @returns {Promise<Object>} Updated session
   */
  async addMessage(phone, direction, type, content) {
    const session = await this.getSession(phone);
    if (!session) {
      throw new Error('Session not found');
    }
    return session.addMessage(direction, type, content);
  }

  /**
   * Set complaint description
   * @param {string} phone - WhatsApp phone number
   * @param {string} description - Complaint text
   * @param {Object} voiceMetadata - Voice transcription metadata
   * @returns {Promise<Object>} Updated session
   */
  async setDescription(phone, description, voiceMetadata = null) {
    const session = await this.getSession(phone);
    if (!session) {
      throw new Error('Session not found');
    }
    return session.setDescription(description, voiceMetadata);
  }

  /**
   * Set location data
   * @param {string} phone - WhatsApp phone number
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {string} address - Optional address string
   * @returns {Promise<Object>} Updated session
   */
  async setLocation(phone, latitude, longitude, address = '') {
    const session = await this.getSession(phone);
    if (!session) {
      throw new Error('Session not found');
    }
    return session.setLocation(latitude, longitude, address);
  }

  /**
   * Add image to session
   * @param {string} phone - WhatsApp phone number
   * @param {string} imageUrl - Image URL
   * @returns {Promise<Object>} Updated session
   */
  async addImage(phone, imageUrl) {
    const session = await this.getSession(phone);
    if (!session) {
      throw new Error('Session not found');
    }
    return session.addImage(imageUrl);
  }

  /**
   * Update session data
   * @param {string} phone - WhatsApp phone number
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Updated session
   */
  async updateData(phone, data) {
    const session = await WhatsAppSession.findOneAndUpdate(
      { phone },
      {
        $set: {
          ...Object.keys(data).reduce((acc, key) => {
            acc[`data.${key}`] = data[key];
            return acc;
          }, {}),
          'metadata.lastActivityAt': new Date(),
        },
      },
      { new: true }
    );
    return session;
  }

  /**
   * Complete session with complaint ID
   * @param {string} phone - WhatsApp phone number
   * @param {string} complaintId - Created complaint ID
   * @returns {Promise<Object>} Updated session
   */
  async completeSession(phone, complaintId) {
    const session = await this.getSession(phone);
    if (!session) {
      throw new Error('Session not found');
    }
    return session.complete(complaintId);
  }

  /**
   * Cancel session
   * @param {string} phone - WhatsApp phone number
   * @returns {Promise<Object>} Updated session
   */
  async cancelSession(phone) {
    const session = await this.getSession(phone);
    if (!session) {
      throw new Error('Session not found');
    }
    return session.cancel();
  }

  /**
   * Reset session to start new complaint
   * @param {string} phone - WhatsApp phone number
   * @returns {Promise<Object>} Reset session
   */
  async resetSession(phone) {
    const session = await this.getSession(phone);
    if (!session) {
      // Create new session if not exists
      return this.getOrCreateSession(phone);
    }
    return session.reset();
  }

  /**
   * Delete session
   * @param {string} phone - WhatsApp phone number
   * @returns {Promise<boolean>} Success
   */
  async deleteSession(phone) {
    const result = await WhatsAppSession.deleteOne({ phone });
    return result.deletedCount > 0;
  }

  /**
   * Get all active sessions
   * @returns {Promise<Array>} Active sessions
   */
  async getActiveSessions() {
    return WhatsAppSession.getActiveSessions();
  }

  /**
   * Get session statistics
   * @returns {Promise<Object>} Session stats
   */
  async getStats() {
    return WhatsAppSession.getSessionStats();
  }

  /**
   * Clean up expired/stale sessions
   * @param {number} hoursOld - Delete sessions inactive for this many hours
   * @returns {Promise<number>} Number of deleted sessions
   */
  async cleanupStaleSessions(hoursOld = 48) {
    const cutoff = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
    const result = await WhatsAppSession.deleteMany({
      'metadata.lastActivityAt': { $lt: cutoff },
      step: { $nin: ['completed'] },
    });
    return result.deletedCount;
  }

  /**
   * Check if session is expired
   * @param {Object} session - Session document
   * @returns {boolean}
   */
  isSessionExpired(session) {
    if (!session) return true;
    return session.expiresAt < new Date();
  }

  /**
   * Extend session expiry
   * @param {string} phone - WhatsApp phone number
   * @param {number} hours - Hours to extend
   * @returns {Promise<Object>} Updated session
   */
  async extendExpiry(phone, hours = 24) {
    const session = await this.getSession(phone);
    if (!session) {
      throw new Error('Session not found');
    }
    return session.extendExpiry(hours);
  }
}

module.exports = new SessionService();
