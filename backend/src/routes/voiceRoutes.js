/**
 * Voice Routes
 * REST API for voice-based complaint submissions
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body, validationResult } = require('express-validator');

const {
  submitVoiceComplaint,
  transcribeOnly,
  getVoiceServiceStatus,
  getSupportedLanguages,
} = require('../controllers/voiceController');

const { optionalAuth } = require('../middlewares/authMiddleware');

// Configure multer for audio uploads
const audioStorage = multer.memoryStorage();

const audioFilter = (req, file, cb) => {
  // Accept audio files
  const allowedTypes = [
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/mp3',
    'audio/mpeg',
    'audio/opus',
    'audio/m4a',
    'audio/aac',
    'audio/x-wav',
    'audio/x-m4a',
    'video/webm', // WhatsApp voice notes
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported audio format: ${file.mimetype}`), false);
  }
};

const uploadAudio = multer({
  storage: audioStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: audioFilter,
});

// Validation middleware
const voiceComplaintValidation = [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[\d\+\-\s\(\)]+$/)
    .withMessage('Invalid phone number format'),
  body('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must be under 500 characters'),
  body('language')
    .optional()
    .isIn(['en', 'hi', 'ur', 'auto'])
    .withMessage('Language must be en, hi, ur, or auto'),
];

const transcribeValidation = [
  body('language')
    .optional()
    .isIn(['en', 'hi', 'ur', 'auto'])
    .withMessage('Language must be en, hi, ur, or auto'),
];

// Validation result handler
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(e => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
};

/**
 * @route   GET /api/v1/voice/status
 * @desc    Get speech service status
 * @access  Public
 */
router.get('/status', getVoiceServiceStatus);

/**
 * @route   GET /api/v1/voice/languages
 * @desc    Get supported languages
 * @access  Public
 */
router.get('/languages', getSupportedLanguages);

/**
 * @route   POST /api/v1/voice/transcribe
 * @desc    Transcribe audio without creating complaint
 * @access  Public
 */
router.post(
  '/transcribe',
  uploadAudio.single('audio'),
  transcribeValidation,
  handleValidation,
  transcribeOnly
);

/**
 * @route   POST /api/v1/voice/complaint
 * @desc    Submit a voice complaint
 * @access  Public (optionalAuth for tracking logged-in users)
 */
router.post(
  '/complaint',
  optionalAuth,
  uploadAudio.single('audio'),
  voiceComplaintValidation,
  handleValidation,
  submitVoiceComplaint
);

module.exports = router;
