const chatbotService = require('../services/chatbotService');

/**
 * Send message to chatbot
 * POST /api/v1/chatbot/message
 */
const sendMessage = async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Validate conversation history if provided
    const history = Array.isArray(conversationHistory) ? conversationHistory : [];

    // Call chatbot service
    const result = await chatbotService.sendChatMessage(message, history);

    res.json({
      success: !result.error,
      response: result.response,
    });
  } catch (error) {
    console.error('Chatbot controller error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your message',
    });
  }
};

/**
 * Get greeting message
 * GET /api/v1/chatbot/greeting
 */
const getGreeting = async (req, res) => {
  try {
    const greeting = chatbotService.getGreeting();
    res.json({
      success: true,
      message: greeting,
    });
  } catch (error) {
    console.error('Get greeting error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred',
    });
  }
};

/**
 * Get quick actions
 * GET /api/v1/chatbot/quick-actions
 */
const getQuickActions = async (req, res) => {
  try {
    const actions = chatbotService.getQuickActions();
    res.json({
      success: true,
      actions,
    });
  } catch (error) {
    console.error('Get quick actions error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred',
    });
  }
};

module.exports = {
  sendMessage,
  getGreeting,
  getQuickActions,
};
