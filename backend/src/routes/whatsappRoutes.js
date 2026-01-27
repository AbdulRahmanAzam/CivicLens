/**
 * WhatsApp Routes
 * API endpoints for WhatsApp bot management and callbacks
 */

const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const sessionService = require('../services/sessionService');

/**
 * GET /api/whatsapp/status
 * Get WhatsApp connection status
 */
router.get('/status', async (req, res) => {
  try {
    const status = whatsappService.getStatus();
    res.json({
      success: true,
      status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/location-callback
 * Receive location from web link
 */
router.post('/location-callback', async (req, res) => {
  try {
    const { phone, sessionId, latitude, longitude, accuracy, source } = req.body;

    // Validate input
    if (!phone || !sessionId || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Verify session exists and is waiting for location
    const session = await sessionService.getSession(phone);
    
    if (!session || session._id.toString() !== sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session or session expired',
      });
    }

    if (session.step !== 'location') {
      return res.status(400).json({
        success: false,
        error: 'Not waiting for location input',
      });
    }

    // Save location to session
    await sessionService.setLocation(phone, latitude, longitude, 'Location from web');
    
    // Update step to image
    await sessionService.updateStep(phone, 'image');

    // Send confirmation to WhatsApp
    const whatsappConversationService = require('../services/whatsappConversationService');
    await whatsappConversationService.sendMessage(
      phone,
      `✅ Location received! (±${Math.round(accuracy)}m accuracy)\n\n` +
      whatsappConversationService.getMessage('askImage')
    );

    res.json({
      success: true,
      message: 'Location saved successfully',
    });
  } catch (error) {
    console.error('Location callback error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/send-location-link
 * Generate and send location sharing link
 */
router.post('/send-location-link', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number required',
      });
    }

    // Get session
    const session = await sessionService.getSession(phone);
    
    if (!session) {
      return res.status(400).json({
        success: false,
        error: 'No active session found',
      });
    }

    // Generate location link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const locationUrl = `${baseUrl}/share-location?phone=${encodeURIComponent(phone)}&session=${session._id}`;

    // Send link via WhatsApp
    await whatsappService.sendText(
      phone,
      `📍 Click the link below to share your location instantly:\n\n${locationUrl}\n\n` +
      `Or tap the attachment (+) icon → Location → Send Your Current Location`
    );

    res.json({
      success: true,
      message: 'Location link sent',
      url: locationUrl,
    });
  } catch (error) {
    console.error('Send location link error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
