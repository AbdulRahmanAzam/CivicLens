const Groq = require('groq-sdk');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Text-to-Speech Service
 * Converts text responses to audio for WhatsApp
 */
class TTSService {
  constructor() {
    this.tempDir = path.join(__dirname, '../../temp/tts');
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating TTS temp directory:', error);
    }
  }

  /**
   * Convert text to speech using external TTS API
   * Note: GROQ doesn't have TTS yet, so we'll use a fallback approach
   * This can be replaced with Google TTS, ElevenLabs, or Azure TTS
   */
  async textToSpeech(text, language = 'en') {
    try {
      // For now, return null to indicate TTS is not available
      // When you have a TTS API key, implement here
      console.log('TTS Service: Text-to-speech called but no TTS API configured');
      console.log('Text to convert:', text.substring(0, 100) + '...');
      
      // Return structured response indicating TTS is not available
      return {
        success: false,
        message: 'TTS not configured. Sending text response instead.',
        text: text
      };

      // TODO: Implement actual TTS using one of these options:
      // Option 1: Google Cloud TTS
      // Option 2: ElevenLabs
      // Option 3: Microsoft Azure TTS
      // Option 4: OpenAI TTS
    } catch (error) {
      console.error('TTS Error:', error);
      return {
        success: false,
        message: error.message,
        text: text
      };
    }
  }

  /**
   * Detect language from text for appropriate TTS voice
   */
  async detectLanguage(text) {
    const prompt = `Detect the primary language of this text. Respond with only the language code (en, ur, hi, or mixed):
"${text.substring(0, 200)}"`;

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 10
      });

      const lang = response.choices[0]?.message?.content?.toLowerCase().trim();
      return ['en', 'ur', 'hi', 'mixed'].includes(lang) ? lang : 'en';
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en';
    }
  }

  /**
   * Format text for better TTS output
   */
  formatForTTS(text) {
    return text
      // Remove emojis (TTS can't pronounce them)
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      // Remove markdown formatting
      .replace(/\*+/g, '')
      .replace(/_+/g, '')
      .replace(/`+/g, '')
      // Convert bullet points to spoken format
      .replace(/•/g, ', ')
      .replace(/\n-\s/g, ', ')
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Check if response is suitable for TTS
   * (short enough, not purely informational list)
   */
  shouldUseTTS(text) {
    // Don't use TTS for very long texts
    if (text.length > 500) return false;
    
    // Don't use TTS for lists with many items
    const bulletCount = (text.match(/•|^-\s/gm) || []).length;
    if (bulletCount > 5) return false;
    
    return true;
  }

  /**
   * Clean up temporary TTS files
   */
  async cleanupTempFiles(maxAgeMs = 3600000) {
    try {
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtimeMs > maxAgeMs) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.error('Error cleaning up TTS temp files:', error);
    }
  }
}

module.exports = new TTSService();
