/**
 * Audio Utilities
 * Handles audio conversion, validation, and processing for speech-to-text
 * Uses ffmpeg for format conversion
 */

const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const fs = require('fs').promises;
const path = require('path');
const { createWriteStream, createReadStream } = require('fs');
const os = require('os');
const crypto = require('crypto');
const axios = require('axios');

// Try to load ffprobe-static (optional)
let ffprobeStatic = null;
try {
  ffprobeStatic = require('ffprobe-static');
} catch (e) {
  console.warn('⚠️ ffprobe-static not found. Audio duration detection may not work. Run: npm install ffprobe-static');
}

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

// Set ffprobe path if available
if (ffprobeStatic?.path) {
  ffmpeg.setFfprobePath(ffprobeStatic.path);
} else if (process.env.FFPROBE_PATH) {
  ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
}

// Configuration
const AUDIO_CONFIG = {
  maxDurationSeconds: 30,
  maxFileSizeMB: 10,
  supportedFormats: ['wav', 'webm', 'ogg', 'mp3', 'opus', 'm4a', 'aac'],
  supportedMimeTypes: [
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
  ],
  outputSampleRate: 16000,
  outputChannels: 1,
  tempDir: path.join(os.tmpdir(), 'civiclens-audio'),
};

/**
 * Initialize temp directory
 */
const initTempDir = async () => {
  try {
    await fs.mkdir(AUDIO_CONFIG.tempDir, { recursive: true });
  } catch (error) {
    console.error('Failed to create temp directory:', error);
  }
};

// Initialize on module load
initTempDir();

/**
 * Generate unique temp file path
 */
const getTempFilePath = (extension = 'wav') => {
  const uniqueId = crypto.randomBytes(8).toString('hex');
  return path.join(AUDIO_CONFIG.tempDir, `audio_${uniqueId}.${extension}`);
};

/**
 * Validate audio buffer/file
 * @param {Buffer} buffer - Audio buffer
 * @param {string} mimeType - MIME type of audio
 * @returns {Object} Validation result
 */
const validateAudio = (buffer, mimeType) => {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // Check buffer
  if (!buffer || buffer.length === 0) {
    result.valid = false;
    result.errors.push('Audio buffer is empty');
    return result;
  }

  // Check file size
  const sizeMB = buffer.length / (1024 * 1024);
  if (sizeMB > AUDIO_CONFIG.maxFileSizeMB) {
    result.valid = false;
    result.errors.push(`File size ${sizeMB.toFixed(2)}MB exceeds maximum ${AUDIO_CONFIG.maxFileSizeMB}MB`);
  }

  // Check MIME type
  if (mimeType) {
    const normalizedMime = mimeType.toLowerCase().split(';')[0].trim();
    if (!AUDIO_CONFIG.supportedMimeTypes.includes(normalizedMime)) {
      result.warnings.push(`MIME type '${mimeType}' may not be fully supported`);
    }
  }

  return result;
};

/**
 * Get audio duration using ffprobe
 * @param {string} filePath - Path to audio file
 * @returns {Promise<number>} Duration in seconds
 */
const getDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to get audio duration: ${err.message}`));
        return;
      }
      resolve(metadata.format.duration || 0);
    });
  });
};

/**
 * Get audio metadata
 * @param {string} filePath - Path to audio file
 * @returns {Promise<Object>} Audio metadata
 */
const getMetadata = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to get audio metadata: ${err.message}`));
        return;
      }
      
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio') || {};
      
      resolve({
        duration: metadata.format.duration || 0,
        sampleRate: audioStream.sample_rate || 0,
        channels: audioStream.channels || 0,
        codec: audioStream.codec_name || 'unknown',
        bitrate: metadata.format.bit_rate || 0,
        format: metadata.format.format_name || 'unknown',
      });
    });
  });
};

/**
 * Convert audio buffer to WAV format (16kHz mono)
 * Required format for whisper.cpp
 * @param {Buffer} inputBuffer - Input audio buffer
 * @param {string} inputFormat - Input format extension (e.g., 'webm', 'mp3')
 * @returns {Promise<Object>} Converted audio info
 */
const convertToWav = async (inputBuffer, inputFormat = 'webm') => {
  const inputPath = getTempFilePath(inputFormat);
  const outputPath = getTempFilePath('wav');

  try {
    // Write input buffer to temp file
    await fs.writeFile(inputPath, inputBuffer);

    // Check duration before conversion
    const duration = await getDuration(inputPath);
    if (duration > AUDIO_CONFIG.maxDurationSeconds) {
      throw new Error(`Audio duration ${duration.toFixed(1)}s exceeds maximum ${AUDIO_CONFIG.maxDurationSeconds}s`);
    }

    // Convert to WAV
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFrequency(AUDIO_CONFIG.outputSampleRate)
        .audioChannels(AUDIO_CONFIG.outputChannels)
        .audioCodec('pcm_s16le')
        .format('wav')
        .on('error', (err) => {
          reject(new Error(`Audio conversion failed: ${err.message}`));
        })
        .on('end', resolve)
        .save(outputPath);
    });

    // Read converted file
    const outputBuffer = await fs.readFile(outputPath);

    return {
      buffer: outputBuffer,
      path: outputPath,
      duration,
      sampleRate: AUDIO_CONFIG.outputSampleRate,
      channels: AUDIO_CONFIG.outputChannels,
    };
  } finally {
    // Clean up input file
    try {
      await fs.unlink(inputPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
};

/**
 * Download audio from URL
 * @param {string} url - Audio URL
 * @param {Object} options - Download options
 * @returns {Promise<Object>} Downloaded audio info
 */
const downloadFromUrl = async (url, options = {}) => {
  const { headers = {}, timeout = 30000 } = options;
  
  try {
    const response = await axios({
      method: 'GET',
      url,
      responseType: 'arraybuffer',
      timeout,
      headers: {
        'User-Agent': 'CivicLens/1.0',
        ...headers,
      },
    });

    const contentType = response.headers['content-type'] || 'audio/ogg';
    const buffer = Buffer.from(response.data);

    // Determine format from content type or URL
    let format = 'ogg';
    if (contentType.includes('webm')) format = 'webm';
    else if (contentType.includes('mp3') || contentType.includes('mpeg')) format = 'mp3';
    else if (contentType.includes('wav')) format = 'wav';
    else if (contentType.includes('m4a')) format = 'm4a';
    else if (contentType.includes('opus')) format = 'opus';

    return {
      buffer,
      format,
      contentType,
      size: buffer.length,
    };
  } catch (error) {
    throw new Error(`Failed to download audio: ${error.message}`);
  }
};

/**
 * Clean up temp file
 * @param {string} filePath - Path to file
 */
const cleanupTempFile = async (filePath) => {
  try {
    if (filePath && filePath.startsWith(AUDIO_CONFIG.tempDir)) {
      await fs.unlink(filePath);
    }
  } catch (error) {
    // Ignore cleanup errors
  }
};

/**
 * Clean up old temp files (older than 1 hour)
 */
const cleanupOldTempFiles = async () => {
  try {
    const files = await fs.readdir(AUDIO_CONFIG.tempDir);
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    for (const file of files) {
      const filePath = path.join(AUDIO_CONFIG.tempDir, file);
      try {
        const stats = await fs.stat(filePath);
        if (stats.mtimeMs < oneHourAgo) {
          await fs.unlink(filePath);
        }
      } catch (e) {
        // Ignore individual file errors
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

/**
 * Extract format from MIME type
 * @param {string} mimeType - MIME type
 * @returns {string} Format extension
 */
const formatFromMimeType = (mimeType) => {
  const mimeMap = {
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/webm': 'webm',
    'video/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/opus': 'opus',
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'audio/m4a': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/aac': 'aac',
  };

  const normalized = (mimeType || '').toLowerCase().split(';')[0].trim();
  return mimeMap[normalized] || 'ogg';
};

// Schedule cleanup every hour
setInterval(cleanupOldTempFiles, 60 * 60 * 1000);

module.exports = {
  AUDIO_CONFIG,
  validateAudio,
  getDuration,
  getMetadata,
  convertToWav,
  downloadFromUrl,
  cleanupTempFile,
  cleanupOldTempFiles,
  getTempFilePath,
  formatFromMimeType,
};
