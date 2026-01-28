/**
 * WhatsApp Session Model
 * Stores conversation state for WhatsApp users
 * Used for multi-step complaint submission flow
 */

const mongoose = require('mongoose');

const WhatsAppSessionSchema = new mongoose.Schema(
  {
    // Phone number (WhatsApp ID)
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      index: true,
    },

    // Current conversation step
    step: {
      type: String,
      enum: ['greeting', 'complaint', 'location', 'image', 'confirm', 'completed', 'cancelled'],
      default: 'greeting',
    },

    // Collected complaint data
    data: {
      // Complaint description (text or transcribed voice)
      description: {
        type: String,
        default: '',
      },

      // Voice transcription metadata
      voiceMetadata: {
        language: String,
        confidence: Number,
        duration: Number,
      },

      // Location data
      location: {
        latitude: Number,
        longitude: Number,
        address: String,
        area: String,
      },

      // Image URLs (from WhatsApp media)
      images: [{
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      }],

      // AI classification preview
      category: {
        primary: String,
        confidence: Number,
      },

      // Additional notes from user
      additionalNotes: String,
    },

    // User info
    userInfo: {
      name: String,
      pushName: String, // WhatsApp display name
      profilePicUrl: String,
    },

    // Conversation history (for context)
    messages: [{
      direction: {
        type: String,
        enum: ['incoming', 'outgoing'],
      },
      type: {
        type: String,
        enum: ['text', 'audio', 'image', 'location', 'button', 'list', 'location_request', 'unknown'],
      },
      content: String,
      timestamp: { type: Date, default: Date.now },
    }],

    // Result
    complaintId: {
      type: String,
      ref: 'Complaint',
    },

    // Session metadata
    metadata: {
      source: {
        type: String,
        default: 'whatsapp',
      },
      startedAt: {
        type: Date,
        default: Date.now,
      },
      lastActivityAt: {
        type: Date,
        default: Date.now,
      },
      messageCount: {
        type: Number,
        default: 0,
      },
      retryCount: {
        type: Number,
        default: 0,
      },
    },

    // Session expiry (TTL)
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      index: { expires: 0 }, // MongoDB TTL index
    },
  },
  {
    timestamps: true,
    collection: 'whatsapp_sessions',
  }
);

// Indexes
WhatsAppSessionSchema.index({ 'metadata.lastActivityAt': 1 });
WhatsAppSessionSchema.index({ step: 1 });

// Instance methods
WhatsAppSessionSchema.methods.updateStep = function (newStep) {
  this.step = newStep;
  this.metadata.lastActivityAt = new Date();
  return this.save();
};

WhatsAppSessionSchema.methods.addMessage = function (direction, type, content) {
  this.messages.push({
    direction,
    type,
    content: typeof content === 'string' ? content : JSON.stringify(content),
    timestamp: new Date(),
  });
  this.metadata.messageCount += 1;
  this.metadata.lastActivityAt = new Date();
  // Keep only last 50 messages
  if (this.messages.length > 50) {
    this.messages = this.messages.slice(-50);
  }
  return this.save();
};

WhatsAppSessionSchema.methods.setDescription = function (description, voiceMetadata = null) {
  this.data.description = description;
  if (voiceMetadata) {
    this.data.voiceMetadata = voiceMetadata;
  }
  this.metadata.lastActivityAt = new Date();
  return this.save();
};

WhatsAppSessionSchema.methods.setLocation = function (latitude, longitude, address = '') {
  this.data.location = {
    latitude,
    longitude,
    address,
  };
  this.metadata.lastActivityAt = new Date();
  return this.save();
};

WhatsAppSessionSchema.methods.addImage = function (imageUrl) {
  if (!this.data.images) {
    this.data.images = [];
  }
  this.data.images.push({
    url: imageUrl,
    uploadedAt: new Date(),
  });
  this.metadata.lastActivityAt = new Date();
  return this.save();
};

WhatsAppSessionSchema.methods.complete = function (complaintId) {
  this.step = 'completed';
  this.complaintId = complaintId;
  this.metadata.lastActivityAt = new Date();
  return this.save();
};

WhatsAppSessionSchema.methods.cancel = function () {
  this.step = 'cancelled';
  this.metadata.lastActivityAt = new Date();
  return this.save();
};

WhatsAppSessionSchema.methods.reset = function () {
  this.step = 'greeting';
  this.data = {
    description: '',
    location: {},
    images: [],
  };
  this.messages = [];
  this.complaintId = null;
  this.metadata.retryCount += 1;
  this.metadata.lastActivityAt = new Date();
  this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return this.save();
};

WhatsAppSessionSchema.methods.extendExpiry = function (hours = 24) {
  this.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  return this.save();
};

// Static methods
WhatsAppSessionSchema.statics.findOrCreate = async function (phone, userInfo = {}) {
  let session = await this.findOne({ phone });
  
  if (!session) {
    session = new this({
      phone,
      userInfo: {
        pushName: userInfo.pushName || '',
        profilePicUrl: userInfo.profilePicUrl || '',
      },
    });
    await session.save();
  } else {
    // Update user info if changed
    if (userInfo.pushName) {
      session.userInfo.pushName = userInfo.pushName;
    }
    session.metadata.lastActivityAt = new Date();
    await session.save();
  }
  
  return session;
};

WhatsAppSessionSchema.statics.getActiveSessions = function () {
  return this.find({
    step: { $nin: ['completed', 'cancelled'] },
  }).sort({ 'metadata.lastActivityAt': -1 });
};

WhatsAppSessionSchema.statics.getSessionStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$step',
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    total: 0,
    byStep: {},
  };

  stats.forEach((stat) => {
    result.byStep[stat._id] = stat.count;
    result.total += stat.count;
  });

  return result;
};

const WhatsAppSession = mongoose.model('WhatsAppSession', WhatsAppSessionSchema);

module.exports = WhatsAppSession;
