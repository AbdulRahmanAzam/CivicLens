const Groq = require('groq-sdk');
const knowledgeBase = require('../data/knowledgeBase.json');

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * RAG Service for intelligent WhatsApp responses
 * Uses knowledge base for contextual answers
 */
class RAGService {
  constructor() {
    this.knowledgeBase = knowledgeBase;
    this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    this.isEnabled = process.env.RAG_ENABLED !== 'false';
    console.log('✅ RAG Service initialized, enabled:', this.isEnabled);
  }

  /**
   * Check if a query is informational (asking about system/Karachi)
   * Uses pattern matching first, then AI for ambiguous cases
   */
  async isInformationalQuery(text) {
    if (!this.isEnabled || !text) return false;
    
    const textLower = text.toLowerCase().trim();
    
    // Quick pattern-based detection for obvious queries
    const infoPatterns = [
      /^(who|what|how|when|where|why|which|tell me|explain|describe)/i,
      /\?$/,  // Ends with question mark
      /mayor|chairman|karachi|town|uc|civiclens|complaint.*category|track.*status/i,
      /helpline|contact|phone.*number|website/i,
      /what.*can|how.*use|how.*submit|how.*track/i,
    ];
    
    // If matches info pattern, likely informational
    if (infoPatterns.some(p => p.test(textLower))) {
      return true;
    }
    
    // Skip AI check for complaint-like text
    const complaintPatterns = [
      /broken|damage|problem|issue|fix|repair|not working/i,
      /garbage|pothole|water.*leak|no.*water|electricity.*cut/i,
      /road|street|light|sewer|drain/i,
    ];
    
    if (complaintPatterns.some(p => p.test(textLower))) {
      return false;
    }
    
    // Use AI for ambiguous cases
    const prompt = `Is this a question asking for information (about CivicLens, Karachi, or civic services) OR is it a complaint about an issue?\n\nText: "${text}"\n\nRespond with only "info" or "complaint".`;

    try {
      const response = await groq.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 10
      });

      const result = response.choices[0]?.message?.content?.toLowerCase().trim();
      return result === 'info';
    } catch (error) {
      console.error('Error checking informational query:', error.message);
      return false; // Default to complaint flow on error
    }
  }

  /**
   * Search knowledge base for relevant context
   */
  searchKnowledgeBase(query) {
    const queryLower = query.toLowerCase();
    const results = [];

    // Search FAQ
    for (const faq of this.knowledgeBase.faq || []) {
      const questionLower = faq.question.toLowerCase();
      const answerLower = faq.answer.toLowerCase();
      if (queryLower.split(' ').some(word => 
        word.length > 3 && (questionLower.includes(word) || answerLower.includes(word))
      )) {
        results.push({ type: 'faq', content: `Q: ${faq.question}\nA: ${faq.answer}` });
      }
    }

    // Search Karachi info
    const karachiKeywords = ['karachi', 'mayor', 'town', 'chairman', 'uc', 'district', 'population', 'kmc', 'wahab'];
    if (karachiKeywords.some(kw => queryLower.includes(kw))) {
      results.push({ 
        type: 'karachi', 
        content: JSON.stringify(this.knowledgeBase.karachi, null, 2) 
      });
    }

    // Search features
    const featureKeywords = ['feature', 'can', 'able', 'what', 'how', 'function'];
    if (featureKeywords.some(kw => queryLower.includes(kw))) {
      const features = this.knowledgeBase.features.map(f => `- ${f.name}: ${f.description}`).join('\n');
      results.push({ type: 'features', content: `CivicLens Features:\n${features}` });
    }

    // Search categories
    const categoryKeywords = ['category', 'categories', 'type', 'issue', 'report', 'road', 'water', 'garbage', 'electricity'];
    if (categoryKeywords.some(kw => queryLower.includes(kw))) {
      const categories = this.knowledgeBase.categories.map(c => 
        `- ${c.name}: ${c.description} (SLA: ${c.slaHours} hours)`
      ).join('\n');
      results.push({ type: 'categories', content: `Complaint Categories:\n${categories}` });
    }

    // Search how to use
    const usageKeywords = ['how', 'use', 'submit', 'track', 'report', 'complain', 'register'];
    if (usageKeywords.some(kw => queryLower.includes(kw))) {
      results.push({ 
        type: 'howToUse', 
        content: JSON.stringify(this.knowledgeBase.howToUse, null, 2) 
      });
    }

    // Search commands
    const commandKeywords = ['command', 'commands', 'what can', 'options', 'menu'];
    if (commandKeywords.some(kw => queryLower.includes(kw))) {
      const commands = this.knowledgeBase.commands.whatsapp
        .map(c => `• ${c.command}: ${c.description}`)
        .join('\n');
      results.push({ type: 'commands', content: `WhatsApp Commands:\n${commands}` });
    }

    // Search system info
    const systemKeywords = ['civiclens', 'civic', 'lens', 'about', 'website', 'contact', 'whatsapp'];
    if (systemKeywords.some(kw => queryLower.includes(kw))) {
      const sys = this.knowledgeBase.system;
      results.push({ 
        type: 'system', 
        content: `About ${sys.name}:\n${sys.description}\n\nWhatsApp: ${sys.whatsappNumber}\nWebsite: ${sys.website}` 
      });
    }

    // Search hierarchy
    const hierarchyKeywords = ['hierarchy', 'structure', 'role', 'roles', 'mayor', 'chairman', 'officer'];
    if (hierarchyKeywords.some(kw => queryLower.includes(kw))) {
      const roles = this.knowledgeBase.hierarchy.roles
        .map(r => `• ${r.role}: ${r.description}`)
        .join('\n');
      results.push({ 
        type: 'hierarchy', 
        content: `Administrative Hierarchy:\n${this.knowledgeBase.hierarchy.structure}\n\nRoles:\n${roles}` 
      });
    }

    // Search helplines
    const helplineKeywords = ['helpline', 'emergency', 'phone', 'number', 'call', 'contact', '1339', '115', '15'];
    if (helplineKeywords.some(kw => queryLower.includes(kw))) {
      const helplines = this.knowledgeBase.karachi.helplines
        .map(h => `• ${h.name}: ${h.number}`)
        .join('\n');
      results.push({ type: 'helplines', content: `Helplines:\n${helplines}` });
    }

    return results;
  }

  /**
   * Generate response using RAG
   */
  async generateResponse(query, conversationHistory = []) {
    const contexts = this.searchKnowledgeBase(query);
    
    // Build context string
    const contextStr = contexts.length > 0 
      ? contexts.map(c => c.content).join('\n\n---\n\n')
      : 'No specific context found. Use general knowledge about civic systems.';

    const systemPrompt = `You are CivicLens AI Assistant, a helpful chatbot for Karachi citizens using the CivicLens complaint management system.

Your role:
1. Answer questions about CivicLens features, how to use it
2. Provide information about Karachi administration (Mayor, Towns, UCs)
3. Help users understand complaint categories and tracking
4. Be polite, helpful, and concise
5. If user wants to file a complaint, guide them to describe their issue

Important:
- Keep responses under 300 words
- Use simple language (many users prefer Urdu/Hindi)
- Include relevant contact numbers when helpful
- Always be encouraging and supportive

Knowledge Base Context:
${contextStr}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-5), // Last 5 messages for context
      { role: 'user', content: query }
    ];

    try {
      const response = await groq.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0]?.message?.content || 'I apologize, I could not generate a response. Please try again.';
    } catch (error) {
      console.error('Error generating RAG response:', error);
      return 'Sorry, I encountered an error. For complaints, please describe your issue with location. For other queries, try again later.';
    }
  }

  /**
   * Get quick answer for common queries
   */
  getQuickAnswer(query) {
    const queryLower = query.toLowerCase();

    // Greetings
    if (/^(hi|hello|hey|assalam|salam|aoa)/.test(queryLower)) {
      return null; // Let conversation service handle complaint flow
    }

    // Help command
    if (/^(help|\?|madad)$/.test(queryLower)) {
      const commands = this.knowledgeBase.commands.whatsapp
        .map(c => `• ${c.command}: ${c.description}`)
        .join('\n');
      return `🆘 *CivicLens Help*\n\nAvailable commands:\n${commands}\n\n📞 WhatsApp: ${this.knowledgeBase.system.whatsappNumber}\n🌐 Website: ${this.knowledgeBase.system.website}`;
    }

    // Status command
    if (/^(status|mycomplaints|history|mere)/.test(queryLower)) {
      return null; // Let conversation service handle status lookup
    }

    // Cancel command
    if (/^(cancel|exit|band|khatam)/.test(queryLower)) {
      return null; // Let conversation service handle cancellation
    }

    return null;
  }

  /**
   * Get relevant context for complaint categorization
   */
  getCategoryContext() {
    return this.knowledgeBase.categories.map(c => ({
      name: c.name,
      description: c.description,
      keywords: c.keywords,
      slaHours: c.slaHours
    }));
  }

  /**
   * Get Karachi town info by name
   */
  getTownInfo(townName) {
    const townLower = townName.toLowerCase();
    return this.knowledgeBase.karachi.towns.find(t => 
      t.name.toLowerCase().includes(townLower) ||
      t.areas.some(a => a.toLowerCase().includes(townLower))
    );
  }

  /**
   * Get system info for responses
   */
  getSystemInfo() {
    return this.knowledgeBase.system;
  }
}

module.exports = new RAGService();
