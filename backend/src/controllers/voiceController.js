/**
 * Voice Complaint Controller
 * Handles voice-based complaint submissions
 */

const { asyncHandler, AppError } = require('../middlewares/errorHandler');
const { SUCCESS_MESSAGES, HTTP_STATUS } = require('../utils/constants');
const speechService = require('../services/speechService');
const { complaintService, classificationService, duplicateService, severityService } = require('../services');

/**
 * @desc    Submit a voice complaint
 * @route   POST /api/v1/complaints/voice
 * @access  Public
 */
const submitVoiceComplaint = asyncHandler(async (req, res) => {
  // Check for audio file
  if (!req.file) {
    throw new AppError('Audio file is required', HTTP_STATUS.BAD_REQUEST);
  }

  const {
    phone,
    name,
    email,
    latitude,
    longitude,
    address,
    language = 'auto',
  } = req.body;

  // Validate location
  if (!latitude || !longitude) {
    throw new AppError('Location coordinates are required', HTTP_STATUS.BAD_REQUEST);
  }

  // Transcribe audio
  const transcription = await speechService.transcribeAudio(req.file.buffer, {
    mimeType: req.file.mimetype,
    language,
  });

  if (!transcription.success) {
    throw new AppError(
      `Failed to transcribe audio: ${transcription.error}`,
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  if (!transcription.transcript || transcription.transcript.length < 10) {
    throw new AppError(
      'Could not understand audio. Please speak clearly or try again.',
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  // Create complaint from transcription
  const complaintData = {
    description: transcription.transcript,
    phone,
    name,
    email,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    address,
    source: 'voice',
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    voiceMetadata: {
      originalLanguage: transcription.language,
      confidence: transcription.confidence,
      duration: transcription.duration,
      processingTime: transcription.processingTime,
    },
  };

  // Create complaint (will trigger AI classification, duplicate check, severity)
  const result = await complaintService.createComplaint(complaintData, []);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: SUCCESS_MESSAGES.COMPLAINT_CREATED,
    data: {
      complaintId: result.complaint.complaintId,
      transcription: {
        text: transcription.transcript,
        language: transcription.language,
        confidence: transcription.confidence,
        duration: transcription.duration,
      },
      category: {
        primary: result.complaint.category.primary,
        subcategory: result.complaint.category.subcategory,
        urgency: result.complaint.category.urgency,
      },
      severity: {
        score: result.complaint.severity.score,
        priority: result.complaint.severity.priority,
      },
      status: result.complaint.status.current,
      location: {
        address: result.complaint.location.address,
        area: result.complaint.location.area,
      },
      duplicateInfo: result.duplicateCheck.isDuplicate
        ? {
            isDuplicate: true,
            similarTo: result.duplicateCheck.potentialDuplicate,
          }
        : { isDuplicate: false },
    },
  });
});

/**
 * @desc    Transcribe audio without creating complaint
 * @route   POST /api/v1/voice/transcribe
 * @access  Public
 */
const transcribeOnly = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('Audio file is required', HTTP_STATUS.BAD_REQUEST);
  }

  const { language = 'auto' } = req.body;

  const transcription = await speechService.transcribeAudio(req.file.buffer, {
    mimeType: req.file.mimetype,
    language,
  });

  if (!transcription.success) {
    throw new AppError(
      `Failed to transcribe audio: ${transcription.error}`,
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      transcript: transcription.transcript,
      language: transcription.language,
      confidence: transcription.confidence,
      duration: transcription.duration,
      processingTime: transcription.processingTime,
      simulation: transcription.simulation || false,
    },
  });
});

/**
 * @desc    Get speech service status
 * @route   GET /api/v1/voice/status
 * @access  Public
 */
const getVoiceServiceStatus = asyncHandler(async (req, res) => {
  const status = await speechService.getServiceStatus();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: status,
  });
});

/**
 * @desc    Get supported languages
 * @route   GET /api/v1/voice/languages
 * @access  Public
 */
const getSupportedLanguages = asyncHandler(async (req, res) => {
  const languages = speechService.getSupportedLanguages();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      languages,
    },
  });
});

module.exports = {
  submitVoiceComplaint,
  transcribeOnly,
  getVoiceServiceStatus,
  getSupportedLanguages,
};
