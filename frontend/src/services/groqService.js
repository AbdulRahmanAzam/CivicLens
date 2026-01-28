/**
 * Groq LLM Service for CivicLens Chatbot
 * Communicates with backend API which handles Groq integration
 */

import { KNOWLEDGE_BASE } from '../data/chatbotKnowledge';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Rate limiting configuration (client-side)
const RATE_LIMIT = {
  maxRequests: 30,
  windowMs: 60000, // 1 minute
  requests: [],
};

class GroqService {
  constructor() {
    this.conversationHistory = [];
    this.maxHistoryLength = 10; // Keep last 10 messages for context
  }

  /**
   * Check if rate limit allows a new request
   */
  checkRateLimit() {
    const now = Date.now();
    // Remove old requests outside the window
    RATE_LIMIT.requests = RATE_LIMIT.requests.filter(
      (time) => now - time < RATE_LIMIT.windowMs
    );
    
    if (RATE_LIMIT.requests.length >= RATE_LIMIT.maxRequests) {
      const oldestRequest = Math.min(...RATE_LIMIT.requests);
      const waitTime = Math.ceil((RATE_LIMIT.windowMs - (now - oldestRequest)) / 1000);
      throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds.`);
    }
    
    RATE_LIMIT.requests.push(now);
    return true;
  }

  /**
   * Send a message to the chatbot
   * @param {string} userMessage - The user's message
   * @returns {Promise<string>} - The assistant's response
   */
  async sendMessage(userMessage) {
    // Check rate limit
    this.checkRateLimit();

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    // Trim history if too long
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
    }

    try {
      const response = await fetch(`${API_URL}/chatbot/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: this.conversationHistory.slice(0, -1) // Exclude the message we just added
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error('Too many requests. Please try again in a moment.');
        } else if (response.status === 503) {
          throw new Error('Service temporarily unavailable. Please try again.');
        } else {
          throw new Error(errorData.message || `API error: ${response.status}`);
        }
      }

      const data = await response.json();
      const assistantMessage = data.response || 'Sorry, I could not generate a response.';

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      });

      return assistantMessage;
    } catch (error) {
      // Remove the user message if request failed
      this.conversationHistory.pop();
      throw error;
    }
  }

  /**
   * Stream a message response (simplified - backend doesn't support streaming yet)
   * @param {string} userMessage - The user's message
   * @param {function} onChunk - Callback for each chunk received
   * @returns {Promise<string>} - The complete response
   */
  async streamMessage(userMessage, onChunk) {
    // For now, just use regular sendMessage and simulate streaming
    const response = await this.sendMessage(userMessage);
    
    // Simulate typing effect
    if (onChunk) {
      const words = response.split(' ');
      for (let i = 0; i < words.length; i++) {
        onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    }
    
    return response;
  }

  /**
   * Clear conversation history (start fresh)
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Get quick action suggestions
   */
  getQuickActions() {
    return KNOWLEDGE_BASE.quickActions;
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured() {
    return true; // Backend handles the API key
  }

  /**
   * Get greeting message
   */
  getGreeting() {
    return `👋 Hi! I'm your CivicLens assistant. I can help you with:

• Submitting and tracking complaints
• Navigating the website
• Understanding blockchain transparency
• Answering your questions

How can I help you today?`;
  }
}

// Export singleton instance
export const groqService = new GroqService();
export default groqService;