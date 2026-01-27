/**
 * WhatsApp Conversation Service
 * Manages state-based complaint conversation flow
 * Steps: greeting → complaint → location → image → confirm → completed
 */

const whatsappService = require('./whatsappService');
const sessionService = require('./sessionService');
const speechService = require('./speechService');
const complaintService = require('./complaintService');
const classificationService = require('./classificationService');
const cloudinaryService = require('./cloudinaryService');
const geoService = require('./geoService');

// Message templates
const MESSAGES = {
  greeting: {
    en: `👋 Welcome to CivicLens!

I can help you report a civic issue in your area.

📝 Please describe your complaint by:
• Typing your complaint
• Sending a voice message

What issue would you like to report?`,
    hi: `👋 CivicLens में आपका स्वागत है!

मैं आपके क्षेत्र में नागरिक समस्या की रिपोर्ट करने में आपकी मदद कर सकता हूं।

📝 कृपया अपनी शिकायत बताएं:
• अपनी शिकायत टाइप करें
• वॉइस मैसेज भेजें

आप किस समस्या की रिपोर्ट करना चाहते हैं?`,
  },

  askLocation: {
    en: `📍 Got it! Now I need your location.

Tap the button below to share your location instantly, or type your address/area name.`,
    hi: `📍 समझ गया! अब मुझे आपका स्थान चाहिए।

अपना स्थान तुरंत साझा करने के लिए नीचे दिए गए बटन पर टैप करें, या अपना पता/क्षेत्र का नाम टाइप करें।`,
  },

  askLocationSimple: {
    en: `📍 Please share your location by tapping the button below 👇

Or type your address if you prefer.`,
    hi: `📍 कृपया नीचे दिए गए बटन पर टैप करके अपना स्थान साझा करें 👇

या यदि आप चाहें तो अपना पता टाइप करें।`,
  },

  askImage: {
    en: `📸 Would you like to add a photo of the problem?

Send a photo or type "skip" to continue without one.`,
    hi: `📸 क्या आप समस्या की फोटो जोड़ना चाहेंगे?

फोटो भेजें या बिना फोटो के जारी रखने के लिए "skip" टाइप करें।`,
  },

  confirm: (data) => ({
    en: `📋 Please confirm your complaint:

📝 Description: ${data.description}
📍 Location: ${data.location?.address || 'Not specified'}
📸 Images: ${data.images?.length || 0} photo(s)

Reply "yes" to submit or "no" to start over.`,
    hi: `📋 कृपया अपनी शिकायत की पुष्टि करें:

📝 विवरण: ${data.description}
📍 स्थान: ${data.location?.address || 'निर्दिष्ट नहीं'}
📸 फोटो: ${data.images?.length || 0} फोटो

सबमिट करने के लिए "yes" या फिर से शुरू करने के लिए "no" टाइप करें।`,
  }),

  success: (complaintId, category) => ({
    en: `✅ Complaint submitted successfully!

🎫 Complaint ID: ${complaintId}
📂 Category: ${category}

You can track your complaint using this ID.

To report another issue, just send a message anytime!`,
    hi: `✅ शिकायत सफलतापूर्वक दर्ज हो गई!

🎫 शिकायत आईडी: ${complaintId}
📂 श्रेणी: ${category}

आप इस आईडी का उपयोग करके अपनी शिकायत को ट्रैक कर सकते हैं।

किसी अन्य समस्या की रिपोर्ट करने के लिए, कभी भी संदेश भेजें!`,
  }),

  cancelled: {
    en: `❌ Complaint cancelled. 

To start a new complaint, just send a message anytime!`,
    hi: `❌ शिकायत रद्द कर दी गई।

नई शिकायत शुरू करने के लिए, कभी भी संदेश भेजें!`,
  },

  error: {
    en: `❌ Sorry, something went wrong. Please try again.

To start over, send "restart"`,
    hi: `❌ क्षमा करें, कुछ गलत हो गया। कृपया फिर से प्रयास करें।

फिर से शुरू करने के लिए, "restart" भेजें`,
  },

  transcribing: {
    en: `🎤 Processing your voice message...`,
    hi: `🎤 आपका वॉइस मैसेज प्रोसेस हो रहा है...`,
  },

  voiceError: {
    en: `❌ Could not understand the voice message. Please try again or type your complaint.`,
    hi: `❌ वॉइस मैसेज समझ नहीं आया। कृपया फिर से प्रयास करें या अपनी शिकायत टाइप करें।`,
  },

  help: {
    en: `ℹ️ CivicLens Help

Commands:
• "restart" - Start a new complaint
• "cancel" - Cancel current complaint
• "status" - Check complaint status
• "help" - Show this message

Send a message to report an issue!`,
    hi: `ℹ️ CivicLens सहायता

आदेश:
• "restart" - नई शिकायत शुरू करें
• "cancel" - वर्तमान शिकायत रद्द करें
• "status" - शिकायत की स्थिति देखें
• "help" - यह संदेश दिखाएं

समस्या रिपोर्ट करने के लिए संदेश भेजें!`,
  },
};

class WhatsAppConversationService {
  constructor() {
    this.defaultLanguage = 'en';
    // Enable web link for location sharing (set to false to disable)
    this.enableLocationWebLink = process.env.ENABLE_LOCATION_WEB_LINK === 'true' || false;
  }

  /**
   * Initialize conversation handler
   */
  initialize() {
    whatsappService.setMessageHandler(this.handleMessage.bind(this));
    console.log('✅ WhatsApp conversation handler initialized');
  }

  /**
   * Get message in appropriate language
   */
  getMessage(key, lang = 'en', data = null) {
    const template = MESSAGES[key];
    if (!template) return '';

    if (typeof template === 'function') {
      const result = template(data);
      return result[lang] || result.en;
    }

    return template[lang] || template.en;
  }

  /**
   * Detect language from text
   */
  detectLanguage(text) {
    // Simple detection based on character ranges
    const hindiPattern = /[\u0900-\u097F]/;
    if (hindiPattern.test(text)) {
      return 'hi';
    }
    return 'en';
  }

  /**
   * Main message handler
   */
  async handleMessage(messageData) {
    const { phone, pushName, type, content } = messageData;

    try {
      // Show typing indicator
      await whatsappService.sendTyping(phone);

      // Get or create session
      const session = await sessionService.getOrCreateSession(phone, { pushName });

      // Log incoming message (sanitize type for unknown messages)
      const messageType = ['text', 'audio', 'image', 'location', 'button', 'list'].includes(type) ? type : 'text';
      await sessionService.addMessage(phone, 'incoming', messageType, 
        typeof content === 'string' ? content : JSON.stringify(content)
      );

      // Handle special commands
      const textContent = type === 'text' ? content.toLowerCase().trim() : '';
      
      if (textContent === 'restart' || textContent === 'new' || textContent === 'start') {
        await this.handleRestart(phone, session);
        return;
      }

      if (textContent === 'cancel' || textContent === 'exit' || textContent === 'quit') {
        await this.handleCancel(phone);
        return;
      }

      if (textContent === 'help' || textContent === '?') {
        await this.sendMessage(phone, this.getMessage('help'));
        return;
      }

      // Process based on current step
      switch (session.step) {
        case 'greeting':
          await this.handleGreeting(phone, messageData, session);
          break;

        case 'complaint':
          await this.handleComplaintInput(phone, messageData, session);
          break;

        case 'location':
          await this.handleLocationInput(phone, messageData, session);
          break;

        case 'image':
          await this.handleImageInput(phone, messageData, session);
          break;

        case 'confirm':
          await this.handleConfirmation(phone, messageData, session);
          break;

        case 'completed':
          // Start new flow
          await this.handleRestart(phone, session);
          break;

        default:
          await this.handleRestart(phone, session);
      }

      // Stop typing
      await whatsappService.stopTyping(phone);

    } catch (error) {
      console.error('Conversation error:', error);
      await this.sendMessage(phone, this.getMessage('error'));
    }
  }

  /**
   * Handle greeting step
   */
  async handleGreeting(phone, messageData, session) {
    // Send greeting and move to complaint step
    await this.sendMessage(phone, this.getMessage('greeting'));
    await sessionService.updateStep(phone, 'complaint');
  }

  /**
   * Handle complaint input (text or voice)
   */
  async handleComplaintInput(phone, messageData, session) {
    const { type, content, mimeType } = messageData;

    let description = '';
    let voiceMetadata = null;

    if (type === 'text') {
      description = content;
    } else if (type === 'audio') {
      // Transcribe voice message
      await this.sendMessage(phone, this.getMessage('transcribing'));

      const transcription = await speechService.transcribeAudio(content, {
        mimeType: mimeType || 'audio/ogg',
        language: 'auto',
      });

      if (!transcription.success || !transcription.transcript) {
        await this.sendMessage(phone, this.getMessage('voiceError'));
        return;
      }

      description = transcription.transcript;
      voiceMetadata = {
        language: transcription.language,
        confidence: transcription.confidence,
        duration: transcription.duration,
      };
    } else {
      await this.sendMessage(phone, '📝 Please send a text message or voice note describing your complaint.');
      return;
    }

    // Validate description
    if (description.length < 10) {
      await this.sendMessage(phone, '❌ Please provide more details about your complaint (at least 10 characters).');
      return;
    }

    // Preview classification
    try {
      const classification = await classificationService.classifyComplaint(description);
      await sessionService.updateData(phone, {
        category: {
          primary: classification.category,
          confidence: classification.confidence,
        },
      });
    } catch (e) {
      // Classification preview is optional
    }

    // Save description and move to location
    await sessionService.setDescription(phone, description, voiceMetadata);
    await sessionService.updateStep(phone, 'location');
    
    // Send location request with button for easy sharing
    await this.sendLocationWithButton(phone);
  }

  /**
   * Send location request with easy-tap button
   */
  async sendLocationWithButton(phone) {
    try {
      // Try to send location request button (easiest for users)
      await whatsappService.sendLocationRequestButton(phone, this.getMessage('askLocationSimple'));
    } catch (error) {
      // Fallback to quick reply buttons
      try {
        await whatsappService.sendLocationQuickReply(phone, this.getMessage('askLocation'));
      } catch (e) {
        // Final fallback to plain text
        await this.sendMessage(phone, this.getMessage('askLocation'));
      }
    }
    
    // Optionally send web link for location sharing
    if (this.enableLocationWebLink) {
      await this.sendLocationWebLink(phone);
    }
    
    // Log the location request
    await sessionService.addMessage(phone, 'outgoing', 'location_request', 'Location request sent');
  }

  /**
   * Send web link for location sharing (as backup method)
   */
  async sendLocationWebLink(phone) {
    try {
      const session = await sessionService.getSession(phone);
      if (!session) return;

      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const locationUrl = `${baseUrl}/share-location?phone=${encodeURIComponent(phone)}&session=${session._id}`;

      // Send link with clear instructions
      await this.sendMessage(
        phone,
        `\n🔗 Or click this link to share location from your browser:\n${locationUrl}`
      );
    } catch (error) {
      console.error('Error sending location web link:', error);
      // Don't fail the whole flow if web link fails
    }
  }

  /**
   * Handle location input
   */
  async handleLocationInput(phone, messageData, session) {
    const { type, content } = messageData;

    let latitude, longitude, address;

    // Handle button response for location sharing
    if (type === 'button') {
      const buttonId = content;
      
      if (buttonId === 'location_gps' || buttonId === 'share_location') {
        // User clicked share location button - send reminder
        await this.sendMessage(phone, 
          '📍 Great! Now tap the attachment (+) icon at the bottom → Location → Send Your Current Location'
        );
        return;
      } else if (buttonId === 'location_type' || buttonId === 'type_location') {
        // User wants to type address
        await this.sendMessage(phone, '✍️ Please type your address or area name:');
        return;
      }
    }

    if (type === 'location') {
      latitude = content.latitude;
      longitude = content.longitude;
      address = content.address || content.name || '';

      // Try to get address from coordinates if not provided
      if (!address) {
        try {
          const geoData = await geoService.reverseGeocode(latitude, longitude);
          address = geoData.address || geoData.area || '';
        } catch (e) {
          // Continue without address
        }
      }
    } else if (type === 'text') {
      // Try to geocode the text address
      try {
        const geoData = await geoService.geocode(content);
        if (geoData && geoData.latitude && geoData.longitude) {
          latitude = geoData.latitude;
          longitude = geoData.longitude;
          address = content;
        } else {
          // Store just the address text
          address = content;
          // Use default coordinates or ask for location
          await this.sendMessage(phone, 
            `📍 I couldn't find the exact location for "${content}". Please share your location using the attachment button, or I'll use this as the address.`
          );
          await sessionService.setLocation(phone, 0, 0, address);
          await sessionService.updateStep(phone, 'image');
          await this.sendMessage(phone, this.getMessage('askImage'));
          return;
        }
      } catch (e) {
        address = content;
        await sessionService.setLocation(phone, 0, 0, address);
        await sessionService.updateStep(phone, 'image');
        await this.sendMessage(phone, this.getMessage('askImage'));
        return;
      }
    } else {
      await this.sendMessage(phone, '📍 Please share your location or type your address.');
      return;
    }

    // Save location and move to image step
    await sessionService.setLocation(phone, latitude, longitude, address);
    await sessionService.updateStep(phone, 'image');
    await this.sendMessage(phone, this.getMessage('askImage'));
  }

  /**
   * Handle image input
   */
  async handleImageInput(phone, messageData, session) {
    const { type, content, caption } = messageData;

    if (type === 'image' && content) {
      // Upload image to cloudinary
      try {
        const uploadResult = await cloudinaryService.uploadBuffer(content, {
          folder: 'whatsapp-complaints',
        });

        await sessionService.addImage(phone, uploadResult.secure_url || uploadResult.url);
        
        await this.sendMessage(phone, '📸 Photo added! Send another photo or type "done" to continue.');
        return;
      } catch (e) {
        console.error('Image upload error:', e);
        await this.sendMessage(phone, '❌ Could not upload photo. Try again or type "skip".');
        return;
      }
    }

    if (type === 'text') {
      const text = content.toLowerCase().trim();
      if (text === 'skip' || text === 'no' || text === 'done') {
        // Move to confirmation
        await this.showConfirmation(phone, session);
        return;
      }
    }

    await this.sendMessage(phone, '📸 Please send a photo or type "skip" to continue.');
  }

  /**
   * Show confirmation message
   */
  async showConfirmation(phone, session) {
    // Refresh session data
    const freshSession = await sessionService.getSession(phone);
    
    await sessionService.updateStep(phone, 'confirm');
    await this.sendMessage(phone, this.getMessage('confirm', 'en', freshSession.data));
  }

  /**
   * Handle confirmation response
   */
  async handleConfirmation(phone, messageData, session) {
    const { type, content } = messageData;

    if (type !== 'text') {
      await this.sendMessage(phone, 'Please reply "yes" to submit or "no" to start over.');
      return;
    }

    const text = content.toLowerCase().trim();

    if (text === 'yes' || text === 'y' || text === 'confirm' || text === 'submit') {
      // Submit complaint
      await this.submitComplaint(phone, session);
    } else if (text === 'no' || text === 'n' || text === 'restart') {
      // Start over
      await this.handleCancel(phone);
    } else {
      await this.sendMessage(phone, 'Please reply "yes" to submit or "no" to cancel.');
    }
  }

  /**
   * Submit the complaint
   */
  async submitComplaint(phone, session) {
    try {
      // Refresh session data
      const freshSession = await sessionService.getSession(phone);
      const data = freshSession.data;

      // Prepare complaint data
      const complaintData = {
        description: data.description,
        phone: phone,
        name: freshSession.userInfo?.pushName || 'WhatsApp User',
        latitude: data.location?.latitude || 0,
        longitude: data.location?.longitude || 0,
        address: data.location?.address || '',
        source: 'whatsapp',
        voiceMetadata: data.voiceMetadata || null,
      };

      // Prepare images
      const images = (data.images || []).map(img => ({ url: img.url }));

      // Create complaint
      const result = await complaintService.createComplaint(complaintData, images);

      // Mark session complete
      await sessionService.completeSession(phone, result.complaint.complaintId);

      // Send success message
      await this.sendMessage(phone, this.getMessage('success', 'en', {
        complaintId: result.complaint.complaintId,
        category: result.complaint.category.primary,
      }));

    } catch (error) {
      console.error('Submit complaint error:', error);
      await this.sendMessage(phone, this.getMessage('error'));
    }
  }

  /**
   * Handle restart command
   */
  async handleRestart(phone, session) {
    await sessionService.resetSession(phone);
    await this.sendMessage(phone, this.getMessage('greeting'));
    await sessionService.updateStep(phone, 'complaint');
  }

  /**
   * Handle cancel command
   */
  async handleCancel(phone) {
    await sessionService.cancelSession(phone);
    await this.sendMessage(phone, this.getMessage('cancelled'));
  }

  /**
   * Send message helper
   */
  async sendMessage(phone, text) {
    await whatsappService.sendText(phone, text);
    await sessionService.addMessage(phone, 'outgoing', 'text', text);
  }

  /**
   * Get conversation statistics
   */
  async getStats() {
    return sessionService.getStats();
  }
}

module.exports = new WhatsAppConversationService();
