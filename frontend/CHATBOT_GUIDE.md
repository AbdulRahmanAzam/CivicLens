# CivicLens AI Chatbot Feature

This document explains how to set up and use the AI-powered chatbot in CivicLens.

## Overview

CivicLens includes an AI chatbot assistant powered by Groq's LLM API. The chatbot helps users:
- Navigate the website
- Submit and track complaints
- Understand blockchain transparency
- Get answers to FAQs

## Architecture

### Components
- `groqService.js` - API integration with Groq
- `chatbotKnowledge.js` - Knowledge base with website info
- `ChatWidget.jsx` - Floating button (bottom-right)
- `ChatWindow.jsx` - Chat interface
- `MessageBubble.jsx` - Message display

### LLM Model
Uses Groq's `llama-3.1-70b-versatile` model for fast, high-quality responses.

## Setup Instructions

### Backend Configuration

The chatbot uses the Groq API key configured in the backend `.env` file:

```
GROQ_API_KEY=gsk_your_groq_api_key_here
```

The backend already has this configured, so no additional setup is needed for the API key.

### Frontend Setup

No additional configuration needed! The frontend communicates with the backend API which handles all Groq integration securely.

Simply ensure your backend is running:

```bash
cd backend
npm run dev
```

Then start the frontend:

```bash
cd frontend
npm run dev
```

## Features

### Floating Widget
- Always visible (bottom-right corner)
- Animated chat icon
- Pulse effect to attract attention
- First-time tooltip for new users

### Chat Interface
- Clean, modern design
- Dark mode support
- Quick action buttons
- Typing indicator
- Message timestamps
- Clear history option

### Knowledge Base
Covers:
- Website navigation
- Feature explanations
- Complaint process
- Blockchain transparency
- Frequently asked questions

## Customization

### Updating Knowledge Base

Edit `frontend/src/data/chatbotKnowledge.js`:

```javascript
export const KNOWLEDGE_BASE = {
  systemPrompt: `Your custom system prompt...`,
  
  // Add new topics
  newTopic: {
    title: "Topic Title",
    content: `Detailed information...`
  }
};
```

### Changing the Model

In `frontend/src/services/groqService.js`:

```javascript
// Available models:
// - llama-3.1-70b-versatile (default)
// - llama-3.1-8b-instant (faster, less capable)
// - mixtral-8x7b-32768 (alternative)
this.model = 'llama-3.1-70b-versatile';
```

### Rate Limiting

Default: 30 requests per minute per user

Adjust in `groqService.js`:
```javascript
const RATE_LIMIT = {
  maxRequests: 30,
  windowMs: 60000, // 1 minute
};
```

## API Reference

### GroqService Methods

```javascript
import groqService from './services/groqService';

// Send message
const response = await groqService.sendMessage("How do I submit a complaint?");

// Stream response (for typing effect)
await groqService.streamMessage(message, (chunk) => {
  console.log(chunk); // Handle each chunk
});

// Clear conversation history
groqService.clearHistory();

// Get quick action suggestions
const actions = groqService.getQuickActions();

// Check if configured
const isReady = groqService.isConfigured();
```

## UI Components

### Using ChatWidget
Already integrated in `App.jsx`. Shows on all pages.

### Custom Integration
```jsx
import { ChatWidget } from './components/Chatbot';

function MyComponent() {
  return (
    <div>
      <ChatWidget />
    </div>
  );
}
```

### Using Individual Components
```jsx
import { MessageBubble, ChatWindow } from './components/Chatbot';

// Display a message
<MessageBubble 
  message="Hello!" 
  isUser={true} 
  timestamp={new Date()} 
/>

// Typing indicator
<MessageBubble isTyping />
```

## Troubleshooting

### "AI chatbot is not configured"
- Ensure the backend is running
- Check that `GROQ_API_KEY` is set in backend `.env`
- Restart the backend server after changing `.env`

### "Rate limit exceeded"
- Wait for the cooldown period
- The backend handles rate limiting automatically

### Chatbot not responding
- Check browser console for errors
- Verify backend is running on `http://localhost:3000`
- Confirm backend API is accessible
- Check Groq API status at https://status.groq.com/

### "An error occurred while processing your message"
- Check backend logs for detailed error messages
- Verify the Groq API key is valid
- Ensure internet connection is stable

## Best Practices

1. **Keep knowledge base updated** - Review and update periodically
2. **Monitor usage** - Track API costs and rate limits
3. **Test responses** - Verify chatbot gives accurate information
4. **User feedback** - Collect feedback to improve responses

## Security Notes

1. **API Key Security**: The Groq API key is stored securely in the backend and never exposed to the frontend.
2. **Backend API**: All chatbot requests go through the backend API at `/api/v1/chatbot/message`.
3. **Rate Limiting**: Implemented on both frontend and backend to prevent abuse.
4. **No Sensitive Data**: Knowledge base contains only public information about the platform.
