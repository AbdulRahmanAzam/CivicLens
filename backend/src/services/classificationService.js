const Groq = require('groq-sdk');
const natural = require('natural');
const { LRUCache } = require('lru-cache');
const env = require('../config/env');

/**
 * Classification Service
 * AI-powered complaint classification using GROQ API with local fallback
 * ZERO COST - Uses free GROQ API + offline rule-based fallback
 */

// Initialize GROQ client (free API)
let groqClient = null;
if (process.env.GROQ_API_KEY) {
  groqClient = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

// Cache for classification results (avoid repeated API calls)
const classificationCache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 60, // 1 hour TTL
});

// TF-IDF for local classification
const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

/**
 * Keyword mappings for rule-based classification
 */
const CATEGORY_KEYWORDS = {
  Roads: {
    primary: ['road', 'pothole', 'street', 'traffic', 'signal', 'bridge', 'footpath', 'pavement', 'divider', 'highway', 'lane', 'crossing'],
    secondary: ['crack', 'broken', 'damage', 'repair', 'construction', 'blocked', 'accident', 'speed', 'bump'],
    weight: 1.0,
  },
  Water: {
    primary: ['water', 'pipe', 'leak', 'sewage', 'drain', 'flood', 'supply', 'tap', 'tank', 'waterlogging', 'pipeline', 'borewell'],
    secondary: ['overflow', 'contaminated', 'dirty', 'shortage', 'pressure', 'billing', 'connection', 'wet'],
    weight: 1.0,
  },
  Garbage: {
    primary: ['garbage', 'trash', 'waste', 'dump', 'smell', 'litter', 'debris', 'bin', 'sanitation', 'cleanliness'],
    secondary: ['stink', 'rotting', 'overflowing', 'collection', 'pickup', 'sweeper', 'dirty', 'unhygienic'],
    weight: 1.0,
  },
  Electricity: {
    primary: ['power', 'electricity', 'outage', 'transformer', 'wire', 'pole', 'voltage', 'meter', 'light', 'streetlight'],
    secondary: ['sparking', 'blackout', 'shock', 'hazard', 'cable', 'fuse', 'billing', 'cutoff', 'hanging'],
    weight: 1.0,
  },
  Others: {
    primary: ['noise', 'pollution', 'encroachment', 'illegal', 'parking', 'stray', 'dog', 'mosquito', 'public'],
    secondary: ['nuisance', 'disturbance', 'construction', 'license', 'permit'],
    weight: 0.7,
  },
};

/**
 * Urgency keywords for determining complaint urgency
 */
const URGENCY_KEYWORDS = {
  critical: ['emergency', 'life-threatening', 'danger', 'death', 'serious', 'urgent', 'immediately', 'fire', 'collapse', 'electrocution'],
  high: ['hazard', 'risk', 'unsafe', 'injured', 'accident', 'flooding', 'sparking', 'exposed', 'children'],
  medium: ['problem', 'issue', 'broken', 'damaged', 'not working', 'repair', 'fix'],
  low: ['request', 'suggestion', 'minor', 'small', 'inconvenience'],
};

/**
 * Subcategory mappings
 */
const SUBCATEGORIES = {
  Roads: {
    pothole: ['pothole', 'hole', 'crater', 'pit'],
    traffic_signal: ['signal', 'traffic light', 'stoplight'],
    street_light: ['street light', 'lamp', 'streetlight', 'lighting'],
    pavement: ['footpath', 'pavement', 'sidewalk', 'walkway'],
    road_damage: ['crack', 'broken', 'damage', 'repair'],
  },
  Water: {
    leakage: ['leak', 'leaking', 'burst', 'broken pipe'],
    supply: ['no water', 'supply', 'shortage', 'pressure'],
    drainage: ['drain', 'drainage', 'clogged', 'blocked'],
    sewage: ['sewage', 'sewer', 'overflow', 'stink'],
    billing: ['bill', 'billing', 'meter', 'charge'],
  },
  Garbage: {
    collection: ['collection', 'pickup', 'not collected'],
    dumping: ['dump', 'dumping', 'illegal dump'],
    bins: ['bin', 'dustbin', 'container', 'overflow'],
    cleaning: ['sweep', 'clean', 'dirty', 'unhygienic'],
  },
  Electricity: {
    outage: ['outage', 'no power', 'blackout', 'cutoff'],
    street_light: ['street light', 'pole light', 'lamp'],
    wiring: ['wire', 'cable', 'hanging', 'exposed'],
    transformer: ['transformer', 'voltage', 'fluctuation'],
    billing: ['bill', 'meter', 'reading'],
  },
};

/**
 * Preprocess text for classification
 */
const preprocessText = (text) => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Generate cache key for classification
 */
const getCacheKey = (text) => {
  const processed = preprocessText(text);
  return `classify:${processed.slice(0, 100)}`;
};

/**
 * GROQ-based classification (FREE API)
 */
const classifyWithGroq = async (text) => {
  if (!groqClient) {
    throw new Error('GROQ client not initialized');
  }

  const systemPrompt = `You are a municipal complaint classification engine. You must respond ONLY in valid JSON format. Do not include any explanation or text outside the JSON.`;

  const userPrompt = `Classify the following citizen complaint into exactly ONE category from: Roads, Water, Garbage, Electricity, Others.

Complaint:
${text}

Respond strictly in this JSON format:
{
  "category": "Roads|Water|Garbage|Electricity|Others",
  "confidence": 0.0,
  "subcategory": "specific issue type",
  "urgency": "low|medium|high|critical",
  "keywords": ["extracted", "keywords"]
}`;

  const completion = await groqClient.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    model: 'llama-3.1-8b-instant',
    temperature: 0.2,
    max_tokens: 300,
    response_format: { type: 'json_object' },
  });

  const response = completion.choices[0]?.message?.content;
  
  if (!response) {
    throw new Error('Empty response from GROQ');
  }

  // Parse JSON response
  const result = JSON.parse(response);

  // Validate response structure
  if (!result.category || !['Roads', 'Water', 'Garbage', 'Electricity', 'Others'].includes(result.category)) {
    throw new Error('Invalid category in response');
  }

  return {
    category: result.category,
    confidence: Math.min(Math.max(result.confidence || 0.8, 0), 1),
    subcategory: result.subcategory || '',
    urgency: result.urgency || 'medium',
    keywords: Array.isArray(result.keywords) ? result.keywords : [],
    source: 'groq',
  };
};

/**
 * Local rule-based classification (ZERO API COST)
 */
const classifyLocally = (text) => {
  const processed = preprocessText(text);
  const tokens = tokenizer.tokenize(processed);
  const stemmedTokens = tokens.map((t) => stemmer.stem(t));

  const scores = {};
  const matchedKeywords = {};

  // Calculate scores for each category
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = 0;
    matchedKeywords[category] = [];

    // Primary keywords (higher weight)
    for (const keyword of keywords.primary) {
      const stemmed = stemmer.stem(keyword);
      if (processed.includes(keyword) || stemmedTokens.includes(stemmed)) {
        scores[category] += 2 * keywords.weight;
        matchedKeywords[category].push(keyword);
      }
    }

    // Secondary keywords (lower weight)
    for (const keyword of keywords.secondary) {
      const stemmed = stemmer.stem(keyword);
      if (processed.includes(keyword) || stemmedTokens.includes(stemmed)) {
        scores[category] += 1 * keywords.weight;
        matchedKeywords[category].push(keyword);
      }
    }
  }

  // Find best category
  let bestCategory = 'Others';
  let bestScore = 0;

  for (const [category, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  // Calculate confidence
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? Math.min(bestScore / (totalScore * 0.6), 1) : 0.3;

  // Detect urgency
  const urgency = detectUrgency(processed);

  // Detect subcategory
  const subcategory = detectSubcategory(processed, bestCategory);

  return {
    category: bestCategory,
    confidence: Math.round(confidence * 100) / 100,
    subcategory,
    urgency,
    keywords: matchedKeywords[bestCategory].slice(0, 5),
    source: 'local',
  };
};

/**
 * Detect urgency from text
 */
const detectUrgency = (text) => {
  const urgencyScores = { critical: 0, high: 0, medium: 0, low: 0 };

  for (const [level, keywords] of Object.entries(URGENCY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        urgencyScores[level] += 1;
      }
    }
  }

  // Determine urgency level
  if (urgencyScores.critical > 0) return 'critical';
  if (urgencyScores.high > 0) return 'high';
  if (urgencyScores.medium > 0) return 'medium';
  return 'low';
};

/**
 * Detect subcategory
 */
const detectSubcategory = (text, category) => {
  const subcats = SUBCATEGORIES[category];
  if (!subcats) return 'general';

  for (const [subcat, keywords] of Object.entries(subcats)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return subcat;
      }
    }
  }

  return 'general';
};

/**
 * TF-IDF based similarity for enhanced classification
 */
const classifyWithTfIdf = (text) => {
  const tfidf = new TfIdf();

  // Add category documents
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const doc = [...keywords.primary, ...keywords.secondary].join(' ');
    tfidf.addDocument(doc, category);
  }

  // Add input text
  tfidf.addDocument(preprocessText(text));

  const scores = {};
  const inputIndex = Object.keys(CATEGORY_KEYWORDS).length;

  // Compare with each category
  tfidf.tfidfs(preprocessText(text), (i, measure, key) => {
    if (key) {
      scores[key] = measure;
    }
  });

  // Find best match
  let bestCategory = 'Others';
  let bestScore = 0;

  for (const [category, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return { category: bestCategory, tfidfScore: bestScore };
};

/**
 * Main classification function
 * Tries GROQ first, falls back to local classification
 */
const classifyComplaint = async (text) => {
  const startTime = Date.now();

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return {
      category: 'Others',
      confidence: 0,
      subcategory: 'general',
      urgency: 'low',
      keywords: [],
      source: 'default',
      processingTime: Date.now() - startTime,
      needsReview: true,
    };
  }

  // Check cache first
  const cacheKey = getCacheKey(text);
  const cached = classificationCache.get(cacheKey);
  if (cached) {
    return {
      ...cached,
      processingTime: Date.now() - startTime,
      fromCache: true,
    };
  }

  let result;
  let needsReview = false;

  // Try GROQ classification first
  if (groqClient) {
    try {
      result = await classifyWithGroq(text);
      console.log(`[Classification] GROQ success: ${result.category} (${result.confidence})`);
    } catch (error) {
      console.warn(`[Classification] GROQ failed: ${error.message}. Falling back to local.`);
    }
  }

  // Fallback to local classification
  if (!result) {
    result = classifyLocally(text);
    console.log(`[Classification] Local: ${result.category} (${result.confidence})`);
  }

  // Flag for manual review if confidence is low
  if (result.confidence < 0.6) {
    needsReview = true;
  }

  // Enhance with TF-IDF if local classification used
  if (result.source === 'local') {
    const tfidfResult = classifyWithTfIdf(text);
    // Adjust confidence based on TF-IDF agreement
    if (tfidfResult.category === result.category) {
      result.confidence = Math.min(result.confidence + 0.1, 1);
    }
  }

  const finalResult = {
    ...result,
    processingTime: Date.now() - startTime,
    needsReview,
  };

  // Cache the result
  classificationCache.set(cacheKey, finalResult);

  return finalResult;
};

/**
 * Batch classification for multiple complaints
 */
const classifyBatch = async (texts) => {
  const results = [];

  for (const text of texts) {
    const result = await classifyComplaint(text);
    results.push(result);
    
    // Small delay to avoid rate limiting
    if (groqClient) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
};

/**
 * Get classification statistics
 */
const getClassificationStats = () => {
  return {
    cacheSize: classificationCache.size,
    cacheHitRate: classificationCache.calculatedSize,
    groqEnabled: !!groqClient,
  };
};

/**
 * Clear classification cache
 */
const clearCache = () => {
  classificationCache.clear();
};

module.exports = {
  classifyComplaint,
  classifyBatch,
  classifyLocally,
  classifyWithGroq,
  getClassificationStats,
  clearCache,
  CATEGORY_KEYWORDS,
  URGENCY_KEYWORDS,
};
