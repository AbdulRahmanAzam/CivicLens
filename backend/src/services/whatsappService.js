/**
 * WhatsApp Service
 * Uses Baileys for FREE WhatsApp automation
 * Connects via QR code - no API fees
 */

const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  downloadMediaMessage,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs').promises;
const path = require('path');
const qrcode = require('qrcode-terminal');
const EventEmitter = require('events');

const speechService = require('./speechService');
const sessionService = require('./sessionService');
const { downloadFromUrl } = require('../utils/audioUtils');

// Configuration
const WHATSAPP_CONFIG = {
  authDir: process.env.WHATSAPP_AUTH_DIR || './whatsapp-auth',
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  messageTimeout: 30000,
};

class WhatsAppService extends EventEmitter {
  constructor() {
    super();
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.qrCode = null;
    this.connectionState = 'disconnected';
    this.messageHandler = null;
  }

  /**
   * Initialize WhatsApp connection
   */
  async connect() {
    try {
      // Ensure auth directory exists
      await fs.mkdir(WHATSAPP_CONFIG.authDir, { recursive: true });

      // Get auth state
      const { state, saveCreds } = await useMultiFileAuthState(WHATSAPP_CONFIG.authDir);

      // Get latest Baileys version
      const { version } = await fetchLatestBaileysVersion();

      // Create socket
      this.socket = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        printQRInTerminal: true,
        browser: Browsers.ubuntu('CivicLens'),
        logger: pino({ level: 'silent' }),
        generateHighQualityLinkPreview: false,
        syncFullHistory: false,
      });

      // Handle connection updates
      this.socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          // Display QR code in terminal
          this.qrCode = qr;
          console.log('\n📱 Scan this QR code with WhatsApp:\n');
          qrcode.generate(qr, { small: true });
          this.emit('qr', qr);
          this.connectionState = 'qr-ready';
        }

        if (connection === 'close') {
          this.isConnected = false;
          this.connectionState = 'disconnected';
          
          const shouldReconnect =
            lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

          if (shouldReconnect && this.reconnectAttempts < WHATSAPP_CONFIG.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Reconnecting... Attempt ${this.reconnectAttempts}`);
            setTimeout(() => this.connect(), WHATSAPP_CONFIG.reconnectInterval);
          } else if (!shouldReconnect) {
            console.log('❌ Logged out. Please delete auth folder and restart.');
            this.emit('logout');
          }
        }

        if (connection === 'open') {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.qrCode = null;
          this.connectionState = 'connected';
          console.log('✅ WhatsApp connected successfully!');
          this.emit('connected');
        }
      });

      // Save credentials when updated
      this.socket.ev.on('creds.update', saveCreds);

      // Handle incoming messages
      this.socket.ev.on('messages.upsert', async ({ messages }) => {
        for (const message of messages) {
          await this.handleIncomingMessage(message);
        }
      });

      return { success: true };
    } catch (error) {
      console.error('WhatsApp connection error:', error);
      this.emit('error', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle incoming WhatsApp message
   */
  async handleIncomingMessage(message) {
    try {
      // Ignore status updates and own messages
      if (message.key.remoteJid === 'status@broadcast') return;
      if (message.key.fromMe) return;

      const phone = message.key.remoteJid.replace('@s.whatsapp.net', '');
      const pushName = message.pushName || '';

      // Parse message content
      const msgContent = message.message;
      if (!msgContent) return;

      let messageData = {
        phone,
        pushName,
        messageId: message.key.id,
        timestamp: new Date(message.messageTimestamp * 1000),
        type: null,
        content: null,
        raw: message,
      };

      // Handle different message types
      if (msgContent.conversation) {
        messageData.type = 'text';
        messageData.content = msgContent.conversation;
      } else if (msgContent.extendedTextMessage) {
        messageData.type = 'text';
        messageData.content = msgContent.extendedTextMessage.text;
      } else if (msgContent.audioMessage) {
        messageData.type = 'audio';
        messageData.content = await this.downloadMedia(message);
        messageData.mimeType = msgContent.audioMessage.mimetype;
        messageData.duration = msgContent.audioMessage.seconds;
      } else if (msgContent.imageMessage) {
        messageData.type = 'image';
        messageData.content = await this.downloadMedia(message);
        messageData.caption = msgContent.imageMessage.caption;
        messageData.mimeType = msgContent.imageMessage.mimetype;
      } else if (msgContent.locationMessage) {
        messageData.type = 'location';
        messageData.content = {
          latitude: msgContent.locationMessage.degreesLatitude,
          longitude: msgContent.locationMessage.degreesLongitude,
          name: msgContent.locationMessage.name,
          address: msgContent.locationMessage.address,
        };
      } else if (msgContent.buttonsResponseMessage) {
        messageData.type = 'button';
        messageData.content = msgContent.buttonsResponseMessage.selectedButtonId;
      } else if (msgContent.listResponseMessage) {
        messageData.type = 'list';
        messageData.content = msgContent.listResponseMessage.singleSelectReply.selectedRowId;
      } else {
        // Unsupported message type
        messageData.type = 'unknown';
        messageData.content = JSON.stringify(msgContent);
      }

      // Emit message event
      this.emit('message', messageData);

      // Call registered message handler
      if (this.messageHandler) {
        await this.messageHandler(messageData);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.emit('error', error);
    }
  }

  /**
   * Download media from WhatsApp message
   */
  async downloadMedia(message) {
    try {
      const buffer = await downloadMediaMessage(
        message,
        'buffer',
        {},
        {
          logger: pino({ level: 'silent' }),
          reuploadRequest: this.socket.updateMediaMessage,
        }
      );
      return buffer;
    } catch (error) {
      console.error('Media download error:', error);
      return null;
    }
  }

  /**
   * Send text message
   */
  async sendText(phone, text) {
    if (!this.isConnected) {
      throw new Error('WhatsApp not connected');
    }

    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
    
    await this.socket.sendMessage(jid, { text });
    return { success: true };
  }

  /**
   * Send message with buttons
   */
  async sendButtons(phone, text, buttons) {
    if (!this.isConnected) {
      throw new Error('WhatsApp not connected');
    }

    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;

    // Note: Buttons may not work on all clients
    const buttonMessage = {
      text,
      footer: 'CivicLens',
      buttons: buttons.map((btn, index) => ({
        buttonId: btn.id || `btn_${index}`,
        buttonText: { displayText: btn.text },
        type: 1,
      })),
      headerType: 1,
    };

    await this.socket.sendMessage(jid, buttonMessage);
    return { success: true };
  }

  /**
   * Send message with list
   */
  async sendList(phone, text, sections, buttonText = 'Options') {
    if (!this.isConnected) {
      throw new Error('WhatsApp not connected');
    }

    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;

    const listMessage = {
      text,
      footer: 'CivicLens',
      title: 'Select an option',
      buttonText,
      sections,
    };

    await this.socket.sendMessage(jid, listMessage);
    return { success: true };
  }

  /**
   * Send location request
   */
  async sendLocationRequest(phone, text) {
    if (!this.isConnected) {
      throw new Error('WhatsApp not connected');
    }

    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;

    // Request location
    await this.socket.sendMessage(jid, {
      text: `${text}\n\n📍 Please share your location by:\n1. Tap the attachment (+) icon\n2. Select "Location"\n3. Choose "Send Your Current Location"`,
    });

    return { success: true };
  }

  /**
   * Send image
   */
  async sendImage(phone, imageBuffer, caption = '') {
    if (!this.isConnected) {
      throw new Error('WhatsApp not connected');
    }

    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;

    await this.socket.sendMessage(jid, {
      image: imageBuffer,
      caption,
    });

    return { success: true };
  }

  /**
   * Send typing indicator
   */
  async sendTyping(phone) {
    if (!this.isConnected) return;

    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
    await this.socket.sendPresenceUpdate('composing', jid);
  }

  /**
   * Stop typing indicator
   */
  async stopTyping(phone) {
    if (!this.isConnected) return;

    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
    await this.socket.sendPresenceUpdate('paused', jid);
  }

  /**
   * Register message handler function
   */
  setMessageHandler(handler) {
    this.messageHandler = handler;
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      state: this.connectionState,
      qrAvailable: !!this.qrCode,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Disconnect WhatsApp
   */
  async disconnect() {
    if (this.socket) {
      await this.socket.logout();
      this.socket = null;
      this.isConnected = false;
      this.connectionState = 'disconnected';
    }
  }

  /**
   * Clear auth data (logout)
   */
  async clearAuth() {
    try {
      await fs.rm(WHATSAPP_CONFIG.authDir, { recursive: true, force: true });
      console.log('Auth data cleared');
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  }
}

// Export singleton
module.exports = new WhatsAppService();
