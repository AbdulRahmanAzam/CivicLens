const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AppError } = require('./errorHandler');

/**
 * Allowed MIME types for image uploads
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

/**
 * File size limit (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Maximum number of files per upload
 */
const MAX_FILES = 5;

/**
 * Multer storage configuration
 * Store images locally under /uploads/complaints
 */
const uploadsRoot = path.join(__dirname, '../../uploads/complaints');
fs.mkdirSync(uploadsRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsRoot);
  },
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase();
    const uniqueName = `complaint-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, uniqueName);
  },
});

/**
 * File filter to validate uploaded files
 */
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Invalid file type: ${file.mimetype}. Allowed types: jpeg, jpg, png, webp`,
        400
      ),
      false
    );
  }
};

/**
 * Configure multer for image uploads
 */
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
  fileFilter,
});

/**
 * Middleware for uploading multiple images
 * Field name: 'images'
 * Max files: 5
 */
const uploadImages = upload.array('images', MAX_FILES);

/**
 * Middleware for uploading a single image
 * Field name: 'image'
 */
const uploadSingleImage = upload.single('image');

/**
 * Error handler for multer errors
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    let message;
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = `Too many files. Maximum is ${MAX_FILES} files`;
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = `Unexpected field name. Use 'images' for multiple files or 'image' for single file`;
        break;
      default:
        message = err.message;
    }
    if (typeof next === 'function') {
      return next(new AppError(message, 400));
    }
    return res.status(400).json({ success: false, message });
  }
  
  if (err) {
    if (typeof next === 'function') {
      return next(err);
    }
    return res.status(500).json({ success: false, message: err.message || 'Upload failed' });
  }
  
  if (typeof next === 'function') {
    next();
  }
};

/**
 * Combined middleware for handling image uploads with error handling
 */
const uploadImagesMiddleware = (req, res, next) => {
  uploadImages(req, res, (err) => {
    handleUploadError(err, req, res, next);
  });
};

/**
 * Combined middleware for handling single image upload with error handling
 */
const uploadSingleImageMiddleware = (req, res, next) => {
  uploadSingleImage(req, res, (err) => {
    handleUploadError(err, req, res, next);
  });
};

/**
 * Validate uploaded files (additional validation after multer)
 */
const validateUploadedFiles = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    // Additional validation can be added here
    // For example, checking image dimensions, scanning for malware, etc.
    
    // Log file info in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Uploaded ${req.files.length} file(s):`);
      req.files.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.originalname} (${file.size} bytes)`);
      });
    }
  }
  
  next();
};

module.exports = {
  uploadImages,
  uploadSingleImage,
  uploadImagesMiddleware,
  uploadSingleImageMiddleware,
  validateUploadedFiles,
  handleUploadError,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES,
};
