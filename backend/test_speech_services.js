/**
 * Test Script for Speech-to-Text and Text-to-Speech Services
 */

const speechService = require('./src/services/speechService');
const ttsService = require('./src/services/ttsService');
const fs = require('fs').promises;
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n${colors.cyan}${msg}${colors.reset}\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n`),
};

/**
 * Test Speech-to-Text Service
 */
async function testSTT() {
  log.section('Testing Speech-to-Text Service');
  
  try {
    // Check service availability
    log.info('Checking speech service availability...');
    const status = await speechService.getServiceStatus();
    
    console.log('\n📊 Service Status:');
    console.log(`   Mode: ${status.mode}`);
    console.log(`   Available: ${status.available ? '✅ Yes' : '❌ No'}`);
    console.log(`   Model: ${status.model}`);
    console.log(`   Languages: ${status.supportedLanguages.map(l => l.code).join(', ')}`);
    console.log(`   Max Duration: ${status.maxDuration}s`);
    console.log(`   Max File Size: ${status.maxFileSize}MB`);
    
    if (status.mode === 'simulation') {
      log.warn('Running in SIMULATION mode - Whisper.cpp not installed');
      log.info('To enable real STT:');
      log.info('  1. Run: cd backend/scripts && ./setup-whisper.ps1');
      log.info('  2. Or manually install whisper.cpp');
    } else {
      log.success('Whisper.cpp is properly configured');
    }
    
    // Test with sample audio (if available)
    const testAudioPath = path.join(__dirname, 'test_audio.wav');
    try {
      await fs.access(testAudioPath);
      log.info(`\nTesting with sample audio file: ${testAudioPath}`);
      
      const audioBuffer = await fs.readFile(testAudioPath);
      const result = await speechService.transcribeAudio(audioBuffer, {
        mimeType: 'audio/wav',
        language: 'auto',
      });
      
      if (result.success) {
        log.success('Transcription successful');
        console.log(`\n📝 Transcript: "${result.transcript}"`);
        console.log(`   Language: ${result.language}`);
        console.log(`   Confidence: ${(result.confidence * 100).toFixed(2)}%`);
        console.log(`   Processing Time: ${result.processingTime}ms`);
      } else {
        log.error(`Transcription failed: ${result.error}`);
      }
    } catch (e) {
      log.info('No test audio file found - skipping transcription test');
      log.info('Place a test audio file at: backend/test_audio.wav');
    }
    
  } catch (error) {
    log.error(`STT test failed: ${error.message}`);
    console.error(error);
  }
}

/**
 * Test Text-to-Speech Service
 */
async function testTTS() {
  log.section('Testing Text-to-Speech Service');
  
  try {
    const testText = 'Hello! This is a test of the text-to-speech system for CivicLens.';
    
    log.info(`Testing TTS with text: "${testText}"`);
    
    const result = await ttsService.textToSpeech(testText, 'en');
    
    if (result.success) {
      log.success('TTS successful');
      if (result.audioPath) {
        console.log(`\n🔊 Audio file: ${result.audioPath}`);
        console.log(`   Duration: ${result.duration || 'unknown'}s`);
      }
    } else {
      log.warn('TTS not configured yet');
      console.log(`   Message: ${result.message}`);
      log.info('\nTTS requires external API:');
      log.info('  Options:');
      log.info('    1. Google Cloud TTS');
      log.info('    2. Microsoft Azure TTS');
      log.info('    3. ElevenLabs API');
      log.info('    4. OpenAI TTS');
      log.info('\n  Add API key to .env and update ttsService.js');
    }
    
    // Test language detection
    log.info('\nTesting language detection...');
    const hindiText = 'यह एक परीक्षण संदेश है';
    const englishText = 'This is a test message';
    const urduText = 'یہ ایک ٹیسٹ پیغام ہے';
    
    const langHindi = await ttsService.detectLanguage(hindiText);
    const langEnglish = await ttsService.detectLanguage(englishText);
    const langUrdu = await ttsService.detectLanguage(urduText);
    
    console.log(`\n🌐 Language Detection:`);
    console.log(`   Hindi text → ${langHindi}`);
    console.log(`   English text → ${langEnglish}`);
    console.log(`   Urdu text → ${langUrdu}`);
    
    // Test text formatting
    log.info('\nTesting TTS text formatting...');
    const rawText = '✅ *Your complaint* has been submitted! 🎫 ID: CL-20260128-00123 📂 Category: Roads';
    const formatted = ttsService.formatForTTS(rawText);
    console.log(`\n📄 Original: "${rawText}"`);
    console.log(`   Formatted: "${formatted}"`);
    
    // Test shouldUseTTS check
    const shortText = 'Your complaint has been received.';
    const longText = 'A'.repeat(600);
    const listText = '• Item 1\n• Item 2\n• Item 3\n• Item 4\n• Item 5\n• Item 6\n• Item 7';
    
    console.log(`\n🤔 Should use TTS?`);
    console.log(`   Short text (${shortText.length} chars): ${ttsService.shouldUseTTS(shortText) ? '✅ Yes' : '❌ No'}`);
    console.log(`   Long text (${longText.length} chars): ${ttsService.shouldUseTTS(longText) ? '✅ Yes' : '❌ No'}`);
    console.log(`   List text (7 items): ${ttsService.shouldUseTTS(listText) ? '✅ Yes' : '❌ No'}`);
    
  } catch (error) {
    log.error(`TTS test failed: ${error.message}`);
    console.error(error);
  }
}

/**
 * Test RAG Service
 */
async function testRAG() {
  log.section('Testing RAG Service');
  
  try {
    const ragService = require('./src/services/ragService');
    
    // Test informational query detection
    log.info('Testing informational query detection...');
    
    const testQueries = [
      { text: 'What is CivicLens?', expected: true },
      { text: 'Who is the mayor of Karachi?', expected: true },
      { text: 'There is a big pothole on my street', expected: false },
      { text: 'How do I submit a complaint?', expected: true },
      { text: 'My garbage is not collected', expected: false },
    ];
    
    for (const query of testQueries) {
      const isInfo = await ragService.isInformationalQuery(query.text);
      const status = isInfo === query.expected ? '✅' : '❌';
      console.log(`   ${status} "${query.text}" → ${isInfo ? 'Info' : 'Complaint'} (expected: ${query.expected ? 'Info' : 'Complaint'})`);
    }
    
    // Test knowledge base search
    log.info('\nTesting knowledge base search...');
    
    const searchQueries = [
      'mayor of Karachi',
      'complaint categories',
      'how to use whatsapp',
      'helpline numbers',
    ];
    
    for (const query of searchQueries) {
      const results = ragService.searchKnowledgeBase(query);
      console.log(`\n🔍 Query: "${query}"`);
      console.log(`   Results: ${results.length} context(s) found`);
      results.forEach(r => console.log(`     - ${r.type}`));
    }
    
    // Test quick answers
    log.info('\nTesting quick answers...');
    
    const quickQueries = ['help', 'status', 'cancel', 'hi'];
    for (const query of quickQueries) {
      const answer = ragService.getQuickAnswer(query);
      console.log(`\n💬 "${query}" →`, answer ? '✅ Has quick answer' : '❌ No quick answer');
      if (answer) {
        console.log(`   ${answer.substring(0, 80)}...`);
      }
    }
    
    // Test RAG response generation
    log.info('\nTesting RAG response generation...');
    const testQuestion = 'What is CivicLens?';
    console.log(`\nQuery: "${testQuestion}"`);
    log.info('Generating response...');
    
    const response = await ragService.generateResponse(testQuestion);
    console.log(`\n🤖 Response:\n${response}\n`);
    
    log.success('RAG service is working');
    
  } catch (error) {
    log.error(`RAG test failed: ${error.message}`);
    console.error(error);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`\n${colors.cyan}╔${'═'.repeat(58)}╗${colors.reset}`);
  console.log(`${colors.cyan}║${colors.reset}  ${colors.green}CivicLens Speech Services Test Suite${colors.reset}                   ${colors.cyan}║${colors.reset}`);
  console.log(`${colors.cyan}╚${'═'.repeat(58)}╝${colors.reset}\n`);
  
  try {
    await testSTT();
    await testTTS();
    await testRAG();
    
    log.section('Test Summary');
    log.success('All tests completed');
    
    console.log('\n📋 Next Steps:');
    console.log('   1. If STT is in simulation mode, install Whisper.cpp');
    console.log('   2. Configure TTS API (Google/Azure/ElevenLabs/OpenAI)');
    console.log('   3. Test with real WhatsApp voice messages');
    console.log('   4. Monitor GROQ AI usage for RAG responses\n');
    
  } catch (error) {
    log.error(`Test suite failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testSTT, testTTS, testRAG, runTests };
