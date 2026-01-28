const Groq = require('groq-sdk');

/**
 * Chatbot Service - AI-powered assistant using GROQ API
 * FREE - Uses GROQ's free tier API
 */

// Initialize GROQ client
let groqClient = null;
if (process.env.GROQ_API_KEY) {
  groqClient = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

// Knowledge base context (imported from frontend knowledge)
const KNOWLEDGE_BASE_CONTEXT = `
CIVICLENS KNOWLEDGE BASE:

=== WEBSITE FLOW ===

## How to Register/Login
To get started with CivicLens:
- Registration: Click "Get Started", enter name/email/phone, create password, select role, verify email
- Login: Enter registered email and password
- Forgot Password: Click "Forgot Password" on login page

## How to Submit a New Complaint
1. Login to your citizen account
2. Go to Dashboard
3. Click "Report Issue" or "New Complaint" button
4. Fill in the complaint form (Category, Description, Location, Photos, Urgency)
5. Review and Submit

## How to Track Complaint Status
- Go to Dashboard → My Complaints
- View list of all submitted complaints
- Click on any complaint to see details including current status, timeline, assigned officials, comments

Status Meanings:
- Pending: Complaint received, awaiting review
- Under Review: Being evaluated by officials
- In Progress: Work has begun on resolution
- Resolved: Issue has been fixed
- Rejected: Cannot be processed
- Closed: Final status after resolution

=== BLOCKCHAIN TRANSPARENCY ===

## Why Blockchain is Used
- Immutability: Once recorded, data cannot be altered
- Transparency: Anyone can verify records
- Accountability: All status changes are recorded
- Timestamping: Exact time of each action recorded

## What Gets Recorded on Blockchain
For each complaint:
- Unique complaint ID, Timestamp of creation, Category, Hashed details (for privacy), Initial status
For each status update:
- Previous status, New status, Timestamp of change, Transaction hash

## How to Verify on Sepolia Etherscan
1. Find transaction hash in complaint details
2. Click "View on Blockchain"
3. Visit sepolia.etherscan.io
4. Verify timestamp, status, and transaction data

=== FEATURES ===

## Notifications
- Status updates on complaints
- New comments or responses
- Email, In-app, and WhatsApp notifications (if enabled)

## Search and Filters
- Search by keyword, complaint ID, or location
- Filter by Status, Category, Date Range, Severity, Location

## Complaint Categories
- Infrastructure: Road damage, potholes, bridge repairs
- Utilities: Electricity, gas, water supply issues
- Sanitation: Garbage collection, sewage problems
- Environment: Park maintenance, pollution concerns
- Traffic: Signal malfunctions, parking issues
- Health: Hospital services, public health concerns

## Role-Based Access
- Citizen: Submit complaints, track personal complaints, view public map
- Township Official: View area complaints, update status, communicate with citizens
- Mayor: City-wide dashboard, analytics, performance monitoring

=== FAQs ===

Q: Is my data secure?
A: Yes. Database is encrypted, secure authentication, role-based access control. Personal details NOT on blockchain.

Q: Can I edit my complaint after submission?
A: No, original details cannot be edited (blockchain integrity). You CAN add comments with new information.

Q: How long does resolution take?
A: Minor issues: 3-7 days, Moderate: 1-2 weeks, Major: 2-4 weeks, Complex projects: Variable

Q: Who can see my complaint?
A: You, assigned officials, township admins, mayor's office can see full details. Public map shows location/category/status only.

Q: Do I need cryptocurrency?
A: NO. No crypto wallet required. System handles blockchain automatically in the background.

Q: How do I contact support?
A: Use the AI chatbot, click Help icon in dashboard, or email support@civiclens.com
`;

/**
 * Send message to chatbot
 * @param {string} userMessage - User's message
 * @param {Array} conversationHistory - Previous messages (optional)
 * @returns {Promise<{response: string, error: boolean}>}
 */
const sendChatMessage = async (userMessage, conversationHistory = []) => {
  if (!groqClient) {
    return {
      response: 'AI chatbot is not configured. Please contact administrator.',
      error: true,
    };
  }

  try {
    // Build messages array
    const messages = [
      {
        role: 'system',
        content: `You are a helpful assistant for CivicLens, a civic complaint management platform. Your role is to:
- Help users navigate the website and understand features
- Guide them through submitting and tracking complaints
- Explain the blockchain transparency feature
- Answer frequently asked questions

Be concise, friendly, and helpful. Only answer questions related to CivicLens and civic complaints.
If asked about unrelated topics, politely redirect the conversation to CivicLens features.
Format responses clearly using simple language. Use bullet points for lists.

Here is the complete knowledge base to reference when answering questions:

${KNOWLEDGE_BASE_CONTEXT}`,
      },
      ...conversationHistory.slice(-8), // Keep last 8 messages for context
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // Call Groq API
    const completion = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
    });

    const response = completion.choices[0]?.message?.content || 
      'Sorry, I could not generate a response. Please try again.';

    return {
      response,
      error: false,
    };
  } catch (error) {
    console.error('Chatbot service error:', error);
    
    // Handle specific errors
    if (error.status === 429) {
      return {
        response: 'Too many requests. Please wait a moment and try again.',
        error: true,
      };
    }
    
    return {
      response: 'An error occurred while processing your message. Please try again.',
      error: true,
    };
  }
};

/**
 * Get greeting message
 */
const getGreeting = () => {
  return `👋 Hi! I'm your CivicLens assistant. I can help you with:

• Submitting and tracking complaints
• Navigating the website
• Understanding blockchain transparency
• Answering your questions

How can I help you today?`;
};

/**
 * Get quick action suggestions
 */
const getQuickActions = () => {
  return [
    { label: "Submit a complaint", query: "How do I submit a new complaint?" },
    { label: "Track my complaint", query: "How can I track my complaint status?" },
    { label: "Blockchain explained", query: "What is blockchain and why is it used?" },
    { label: "Contact support", query: "How do I contact support?" },
  ];
};

module.exports = {
  sendChatMessage,
  getGreeting,
  getQuickActions,
};
