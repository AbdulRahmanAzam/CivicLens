const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

/**
 * Chatbot Routes
 * Base path: /api/v1/chatbot
 */

// Send message to chatbot (public route - no auth required)
router.post('/message', chatbotController.sendMessage);

// Get greeting message
router.get('/greeting', chatbotController.getGreeting);

// Get quick actions
router.get('/quick-actions', chatbotController.getQuickActions);

module.exports = router;
