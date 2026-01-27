/**
 * WhatsApp Bot Starter
 * Standalone script to run WhatsApp bot
 * Scan QR code to connect
 */

require('dotenv').config();
const mongoose = require('mongoose');
const whatsappService = require('./services/whatsappService');
const whatsappConversationService = require('./services/whatsappConversationService');
const config = require('./config/env');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ MongoDB connected');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
};

// Main function
const startWhatsAppBot = async () => {
  console.log('\n🚀 Starting CivicLens WhatsApp Bot...\n');

  // Connect to database
  const dbConnected = await connectDB();
  if (!dbConnected) {
    console.error('Failed to connect to database. Exiting.');
    process.exit(1);
  }

  // Initialize conversation handler
  whatsappConversationService.initialize();

  // Set up event handlers
  whatsappService.on('connected', () => {
    console.log('\n✅ WhatsApp Bot is now running!');
    console.log('📱 Users can now send messages to report complaints.\n');
  });

  whatsappService.on('qr', (qr) => {
    console.log('\n📱 QR Code ready. Scan with WhatsApp to connect.\n');
  });

  whatsappService.on('logout', () => {
    console.log('\n❌ WhatsApp session logged out.');
    console.log('Delete the whatsapp-auth folder and restart.\n');
  });

  whatsappService.on('error', (error) => {
    console.error('WhatsApp error:', error);
  });

  // Connect to WhatsApp
  console.log('📱 Connecting to WhatsApp...');
  console.log('   (If this is your first time, a QR code will appear below)\n');
  
  await whatsappService.connect();
};

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down WhatsApp bot...');
  await mongoose.connection.close();
  process.exit(0);
});

// Start the bot
startWhatsAppBot().catch(console.error);
