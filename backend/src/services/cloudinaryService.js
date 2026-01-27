const cloudinary = require('cloudinary').v2;
const env = require('../config/env');

/**
 * Cloudinary Service
 * Handles image upload and management
 */
class CloudinaryService {
  constructor() {
    this.isConfigured = false;
    this.configure();
  }

  /**
   * Configure Cloudinary with credentials
   */
  configure() {
    const { cloudName, apiKey, apiSecret } = env.cloudinary;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.isConfigured = true;
      console.log('Cloudinary configured successfully');
    } else {
      console.warn('Cloudinary credentials not configured. Image uploads will use placeholder URLs.');
    }
  }

  /**
   * Upload image to Cloudinary
   * @param {Buffer} buffer - Image buffer
   * @param {Object} options - Upload options
   * @returns {Object} - Upload result with URL and public ID
   */
  async uploadImage(buffer, options = {}) {
    const {
      folder = 'civiclens',
      transformation = { quality: 'auto', fetch_format: 'auto' },
    } = options;

    // If Cloudinary is not configured, return a placeholder
    if (!this.isConfigured) {
      return this.getPlaceholderUpload();
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          transformation,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // Write buffer to stream
      const stream = require('stream');
      const bufferStream = new stream.PassThrough();
      bufferStream.end(buffer);
      bufferStream.pipe(uploadStream);
    });
  }

  /**
   * Upload multiple images
   * @param {Array} buffers - Array of image buffers
   * @param {Object} options - Upload options
   * @returns {Array} - Array of upload results
   */
  async uploadMultiple(buffers, options = {}) {
    const results = [];
    
    for (const buffer of buffers) {
      try {
        const result = await this.uploadImage(buffer, options);
        results.push(result);
      } catch (error) {
        console.error('Failed to upload image:', error.message);
        // Add placeholder for failed upload
        results.push(this.getPlaceholderUpload());
      }
    }

    return results;
  }

  /**
   * Delete image from Cloudinary
   * @param {string} publicId - Public ID of the image
   * @returns {Object} - Deletion result
   */
  async deleteImage(publicId) {
    if (!this.isConfigured) {
      return { result: 'ok' };
    }

    return cloudinary.uploader.destroy(publicId);
  }

  /**
   * Delete multiple images
   * @param {Array} publicIds - Array of public IDs
   * @returns {Object} - Deletion results
   */
  async deleteMultiple(publicIds) {
    if (!this.isConfigured) {
      return { deleted: {} };
    }

    return cloudinary.api.delete_resources(publicIds);
  }

  /**
   * Get optimized URL for an image
   * @param {string} publicId - Public ID of the image
   * @param {Object} options - Transformation options
   * @returns {string} - Optimized URL
   */
  getOptimizedUrl(publicId, options = {}) {
    const {
      width = 800,
      height,
      crop = 'limit',
      quality = 'auto',
      format = 'auto',
    } = options;

    if (!this.isConfigured) {
      return `https://placeholder.com/${width}x${height || width}`;
    }

    return cloudinary.url(publicId, {
      width,
      height,
      crop,
      quality,
      fetch_format: format,
    });
  }

  /**
   * Get thumbnail URL
   */
  getThumbnailUrl(publicId, size = 150) {
    return this.getOptimizedUrl(publicId, {
      width: size,
      height: size,
      crop: 'thumb',
    });
  }

  /**
   * Generate a placeholder upload result
   * Used when Cloudinary is not configured
   */
  getPlaceholderUpload() {
    const id = `placeholder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      public_id: id,
      secure_url: `https://via.placeholder.com/800x600?text=Image+${id.slice(-6)}`,
      url: `https://via.placeholder.com/800x600?text=Image+${id.slice(-6)}`,
      format: 'png',
      width: 800,
      height: 600,
      bytes: 0,
      placeholder: true,
    };
  }
}

module.exports = new CloudinaryService();
