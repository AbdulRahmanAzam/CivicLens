/**
 * Speech Service
 * Offline speech-to-text using whisper.cpp
 * Supports English, Hindi, Urdu
 * Zero-cost, no API keys required
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const {
  validateAudio,
  convertToWav,
  downloadFromUrl,
  cleanupTempFile,
  getTempFilePath,
  formatFromMimeType,
  AUDIO_CONFIG,
} = require('../utils/audioUtils');
const config = require('../config/env');

// Configuration
const SPEECH_CONFIG = {
  // Whisper.cpp paths
  whisperBinPath: process.env.WHISPER_BIN_PATH || './whisper/main',
  whisperModelPath: process.env.WHISPER_MODEL_PATH || './models/ggml-small.bin',
  
  // Whisper settings
  language: 'auto', // auto-detect language
  threads: 4,
  processors: 1,
  
  // Supported languages
  supportedLanguages: ['en', 'hi', 'ur', 'auto'],
  
  // Timeouts
  transcriptionTimeout: 60000, // 60 seconds
  
  // Fallback to simulation mode if whisper not available
  simulationMode: false,
};

// Track initialization
let whisperAvailable = false;
let initializationChecked = false;

/**
 * Check if whisper.cpp is available
 */
const checkWhisperAvailability = async () => {
  if (initializationChecked) {
    return whisperAvailable;
  }

  try {
    // Check if binary exists
    await fs.access(SPEECH_CONFIG.whisperBinPath);
    
    // Check if model exists
    await fs.access(SPEECH_CONFIG.whisperModelPath);
    
    whisperAvailable = true;
    console.log('✅ Whisper.cpp available for speech recognition');
  } catch (error) {
    whisperAvailable = false;
    SPEECH_CONFIG.simulationMode = true;
    console.warn('⚠️ Whisper.cpp not found. Running in simulation mode.');
    console.warn('   To enable speech recognition:');
    console.warn('   1. Download whisper.cpp: https://github.com/ggerganov/whisper.cpp');
    console.warn('   2. Download model: https://huggingface.co/ggerganov/whisper.cpp');
    console.warn(`   3. Place binary at: ${SPEECH_CONFIG.whisperBinPath}`);
    console.warn(`   4. Place model at: ${SPEECH_CONFIG.whisperModelPath}`);
  }

  initializationChecked = true;
  return whisperAvailable;
};

/**
 * Transcribe audio using whisper.cpp
 * @param {string} wavPath - Path to WAV file
 * @param {string} language - Language code (en, hi, ur, auto)
 * @returns {Promise<Object>} Transcription result
 */
const transcribeWithWhisper = async (wavPath, language = 'auto') => {
  return new Promise((resolve, reject) => {
    const outputPath = getTempFilePath('json');
    
    // Build whisper command
    const args = [
      '-m', SPEECH_CONFIG.whisperModelPath,
      '-f', wavPath,
      '-t', String(SPEECH_CONFIG.threads),
      '-p', String(SPEECH_CONFIG.processors),
      '-oj', // Output JSON
      '-of', outputPath.replace('.json', ''), // Output file (without extension)
    ];

    // Add language if specified
    if (language && language !== 'auto') {
      args.push('-l', language);
    }

    // Spawn whisper process
    const whisperProcess = spawn(SPEECH_CONFIG.whisperBinPath, args);
    
    let stderr = '';
    
    whisperProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Timeout handler
    const timeout = setTimeout(() => {
      whisperProcess.kill('SIGKILL');
      reject(new Error('Transcription timed out'));
    }, SPEECH_CONFIG.transcriptionTimeout);

    whisperProcess.on('close', async (code) => {
      clearTimeout(timeout);
      
      if (code !== 0) {
        reject(new Error(`Whisper process failed with code ${code}: ${stderr}`));
        return;
      }

      try {
        // Read JSON output
        const jsonPath = outputPath;
        const jsonContent = await fs.readFile(jsonPath, 'utf-8');
        const result = JSON.parse(jsonContent);
        
        // Clean up JSON file
        await cleanupTempFile(jsonPath);
        
        // Parse result
        const transcript = result.transcription
          ?.map(segment => segment.text)
          .join(' ')
          .trim() || '';

        resolve({
          success: true,
          transcript,
          segments: result.transcription || [],
          language: result.result?.language || language,
          model: 'whisper.cpp',
        });
      } catch (parseError) {
        // If JSON parsing fails, try to extract text from stderr
        const textMatch = stderr.match(/\[.*?\]\s+(.+)/g);
        if (textMatch) {
          const transcript = textMatch
            .map(line => line.replace(/\[.*?\]\s+/, ''))
            .join(' ')
            .trim();

          resolve({
            success: true,
            transcript,
            segments: [],
            language: language,
            model: 'whisper.cpp',
          });
        } else {
          reject(new Error(`Failed to parse whisper output: ${parseError.message}`));
        }
      }
    });

    whisperProcess.on('error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to run whisper: ${err.message}`));
    });
  });
};

/**
 * Simulation mode - for testing without whisper.cpp
 * Returns a mock transcription
 */
const transcribeSimulation = async (wavPath, language = 'auto') => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 500));

  // Return simulation response
  return {
    success: true,
    transcript: '[SIMULATION MODE] This is a simulated transcription. Install whisper.cpp for real speech recognition.',
    segments: [],
    language: language === 'auto' ? 'en' : language,
    model: 'simulation',
    simulation: true,
  };
};

/**
 * Main transcription function
 * @param {Buffer} audioBuffer - Audio file buffer
 * @param {Object} options - Transcription options
 * @returns {Promise<Object>} Transcription result
 */
const transcribeAudio = async (audioBuffer, options = {}) => {
  const {
    mimeType = 'audio/webm',
    language = 'auto',
  } = options;

  const startTime = Date.now();
  let wavPath = null;

  try {
    // Validate audio
    const validation = validateAudio(audioBuffer, mimeType);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', '),
        transcript: null,
      };
    }

    // Get format from MIME type
    const inputFormat = formatFromMimeType(mimeType);

    // Convert to WAV
    const converted = await convertToWav(audioBuffer, inputFormat);
    wavPath = converted.path;

    // Check if whisper is available
    await checkWhisperAvailability();

    // Transcribe
    let result;
    if (whisperAvailable && !SPEECH_CONFIG.simulationMode) {
      result = await transcribeWithWhisper(wavPath, language);
    } else {
      result = await transcribeSimulation(wavPath, language);
    }

    // Post-process transcript
    const cleanedTranscript = postProcessTranscript(result.transcript);

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      transcript: cleanedTranscript,
      originalTranscript: result.transcript,
      confidence: result.simulation ? 0.5 : estimateConfidence(result),
      language: result.language,
      duration: converted.duration,
      processingTime,
      model: result.model,
      simulation: result.simulation || false,
    };
  } catch (error) {
    console.error('Transcription error:', error);
    return {
      success: false,
      error: error.message,
      transcript: null,
    };
  } finally {
    // Clean up WAV file
    if (wavPath) {
      await cleanupTempFile(wavPath);
    }
  }
};

/**
 * Transcribe audio from URL (for WhatsApp voice notes)
 * @param {string} audioUrl - URL of audio file
 * @param {Object} options - Options including headers for auth
 * @returns {Promise<Object>} Transcription result
 */
const transcribeFromUrl = async (audioUrl, options = {}) => {
  try {
    // Download audio
    const downloaded = await downloadFromUrl(audioUrl, {
      headers: options.headers,
      timeout: options.timeout || 30000,
    });

    // Transcribe
    return await transcribeAudio(downloaded.buffer, {
      mimeType: downloaded.contentType,
      language: options.language || 'auto',
    });
  } catch (error) {
    console.error('Transcription from URL error:', error);
    return {
      success: false,
      error: error.message,
      transcript: null,
    };
  }
};

/**
 * Post-process transcript
 * Clean up common issues
 */
const postProcessTranscript = (transcript) => {
  if (!transcript) return '';

  let cleaned = transcript;

  // Remove leading/trailing whitespace
  cleaned = cleaned.trim();

  // Remove repeated spaces
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Remove common whisper artifacts
  cleaned = cleaned.replace(/\[BLANK_AUDIO\]/gi, '');
  cleaned = cleaned.replace(/\[MUSIC\]/gi, '');
  cleaned = cleaned.replace(/\[NOISE\]/gi, '');
  cleaned = cleaned.replace(/\(.*?\)/g, ''); // Remove parenthetical notes

  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned.trim();
};

/**
 * Estimate confidence from whisper output
 */
const estimateConfidence = (result) => {
  // Base confidence
  let confidence = 0.8;

  // Adjust based on segments
  if (result.segments && result.segments.length > 0) {
    // Check for segment confidences if available
    const avgSegmentConf = result.segments.reduce((sum, seg) => {
      return sum + (seg.confidence || 0.8);
    }, 0) / result.segments.length;
    confidence = avgSegmentConf;
  }

  // Adjust for transcript length
  const wordCount = (result.transcript || '').split(/\s+/).length;
  if (wordCount < 3) {
    confidence *= 0.9;
  }

  return Math.min(1, Math.max(0, confidence));
};

/**
 * Get supported languages
 */
const getSupportedLanguages = () => {
  return [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ur', name: 'Urdu' },
    { code: 'auto', name: 'Auto-detect' },
  ];
};

/**
 * Get service status
 */
const getServiceStatus = async () => {
  await checkWhisperAvailability();
  
  return {
    available: whisperAvailable || SPEECH_CONFIG.simulationMode,
    mode: whisperAvailable ? 'whisper' : 'simulation',
    model: SPEECH_CONFIG.whisperModelPath,
    supportedLanguages: getSupportedLanguages(),
    maxDuration: AUDIO_CONFIG.maxDurationSeconds,
    maxFileSize: AUDIO_CONFIG.maxFileSizeMB,
  };
};

module.exports = {
  transcribeAudio,
  transcribeFromUrl,
  getSupportedLanguages,
  getServiceStatus,
  checkWhisperAvailability,
  SPEECH_CONFIG,
};
