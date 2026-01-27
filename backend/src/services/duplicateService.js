const natural = require('natural');
const { LRUCache } = require('lru-cache');
const { Complaint } = require('../models');
const { TIME } = require('../utils/constants');

/**
 * Duplicate Detection Service
 * Detects duplicate complaints using geo proximity + text similarity
 * ZERO API COST - Uses local NLP algorithms only
 */

// Initialize NLP tools
const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// Cache for similarity calculations
const similarityCache = new LRUCache({
  max: 1000,
  ttl: 1000 * 60 * 30, // 30 minutes
});

/**
 * Configuration for duplicate detection
 */
const CONFIG = {
  // Geo proximity settings
  geo: {
    radiusMeters: 200, // Default search radius
    maxRadiusMeters: 500, // Maximum search radius
  },
  // Time window for duplicates
  time: {
    windowDays: 7,
    recentWindowHours: 24,
  },
  // Similarity thresholds
  thresholds: {
    jaccardMin: 0.5,
    cosineMin: 0.7,
    combinedMin: 0.75,
    exactMatch: 0.95,
  },
  // Weights for combined score
  weights: {
    textSimilarity: 0.5,
    geoProximity: 0.25,
    categoryMatch: 0.15,
    timeProximity: 0.1,
  },
};

/**
 * Preprocess text for similarity comparison
 */
const preprocessText = (text) => {
  if (!text) return [];
  
  const cleaned = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const tokens = tokenizer.tokenize(cleaned);
  const stemmed = tokens.map((token) => stemmer.stem(token));
  
  // Remove common stopwords
  const stopwords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
    'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
    'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here',
    'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or',
    'because', 'until', 'while', 'this', 'that', 'these', 'those', 'i', 'me',
    'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it',
    'its', 'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'please',
  ]);
  
  return stemmed.filter((token) => !stopwords.has(token) && token.length > 2);
};

/**
 * Calculate Jaccard similarity between two token sets
 */
const calculateJaccardSimilarity = (tokens1, tokens2) => {
  if (tokens1.length === 0 || tokens2.length === 0) return 0;
  
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  
  const intersection = [...set1].filter((x) => set2.has(x)).length;
  const union = new Set([...set1, ...set2]).size;
  
  return union > 0 ? intersection / union : 0;
};

/**
 * Calculate TF-IDF cosine similarity
 */
const calculateCosineSimilarity = (text1, text2) => {
  const tfidf = new TfIdf();
  
  tfidf.addDocument(text1);
  tfidf.addDocument(text2);
  
  // Get term vectors
  const terms = new Set();
  tfidf.listTerms(0).forEach((item) => terms.add(item.term));
  tfidf.listTerms(1).forEach((item) => terms.add(item.term));
  
  const vector1 = [];
  const vector2 = [];
  
  for (const term of terms) {
    vector1.push(tfidf.tfidf(term, 0));
    vector2.push(tfidf.tfidf(term, 1));
  }
  
  // Calculate cosine similarity
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  for (let i = 0; i < vector1.length; i++) {
    dotProduct += vector1[i] * vector2[i];
    magnitude1 += vector1[i] * vector1[i];
    magnitude2 += vector2[i] * vector2[i];
  }
  
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  
  return dotProduct / (magnitude1 * magnitude2);
};

/**
 * Calculate Levenshtein distance-based similarity (for short texts)
 */
const calculateLevenshteinSimilarity = (text1, text2) => {
  const maxLength = Math.max(text1.length, text2.length);
  if (maxLength === 0) return 1;
  
  const distance = natural.LevenshteinDistance(text1, text2);
  return 1 - (distance / maxLength);
};

/**
 * Calculate combined text similarity score
 */
const calculateTextSimilarity = (text1, text2) => {
  // Preprocess texts
  const tokens1 = preprocessText(text1);
  const tokens2 = preprocessText(text2);
  
  // Calculate different similarity metrics
  const jaccard = calculateJaccardSimilarity(tokens1, tokens2);
  const cosine = calculateCosineSimilarity(text1 || '', text2 || '');
  
  // For short texts, also consider Levenshtein
  let levenshtein = 0;
  if (text1.length < 100 && text2.length < 100) {
    levenshtein = calculateLevenshteinSimilarity(
      text1.toLowerCase(),
      text2.toLowerCase()
    );
  }
  
  // Weighted combination
  const combined = (jaccard * 0.4) + (cosine * 0.5) + (levenshtein * 0.1);
  
  return {
    jaccard: Math.round(jaccard * 100) / 100,
    cosine: Math.round(cosine * 100) / 100,
    levenshtein: Math.round(levenshtein * 100) / 100,
    combined: Math.round(combined * 100) / 100,
  };
};

/**
 * Calculate geo proximity score
 */
const calculateGeoProximityScore = (distance, maxRadius = CONFIG.geo.maxRadiusMeters) => {
  if (distance <= 0) return 1;
  if (distance >= maxRadius) return 0;
  
  // Linear decay
  return 1 - (distance / maxRadius);
};

/**
 * Calculate time proximity score
 */
const calculateTimeProximityScore = (timeDiffHours) => {
  const maxHours = CONFIG.time.windowDays * 24;
  
  if (timeDiffHours <= 0) return 1;
  if (timeDiffHours >= maxHours) return 0;
  
  // Exponential decay - recent complaints are more likely duplicates
  return Math.exp(-timeDiffHours / (maxHours / 3));
};

/**
 * Query nearby complaints from database
 */
const findNearbyComplaints = async (longitude, latitude, options = {}) => {
  const {
    radius = CONFIG.geo.radiusMeters,
    days = CONFIG.time.windowDays,
    category = null,
    excludeIds = [],
    limit = 20,
  } = options;

  const query = {
    location: {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: radius,
      },
    },
    createdAt: {
      $gte: new Date(Date.now() - days * TIME.MS_PER_DAY),
    },
    'status.current': { $nin: ['resolved', 'closed', 'rejected'] },
  };

  if (category) {
    query['category.primary'] = category;
  }

  if (excludeIds.length > 0) {
    query._id = { $nin: excludeIds };
  }

  const complaints = await Complaint.find(query)
    .select('complaintId description category location createdAt status severity')
    .limit(limit)
    .lean();

  return complaints;
};

/**
 * Calculate duplicate score for a pair of complaints
 */
const calculateDuplicateScore = (complaint1, complaint2) => {
  // Text similarity
  const textSim = calculateTextSimilarity(
    complaint1.description,
    complaint2.description
  );

  // Geo proximity (calculate distance if not provided)
  let geoScore = 0;
  if (complaint1.location?.coordinates && complaint2.location?.coordinates) {
    const [lng1, lat1] = complaint1.location.coordinates;
    const [lng2, lat2] = complaint2.location.coordinates;
    
    // Haversine distance calculation
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    geoScore = calculateGeoProximityScore(distance);
  }

  // Category match
  const categoryMatch = 
    complaint1.category?.primary === complaint2.category?.primary ? 1 : 0;

  // Time proximity
  const timeDiff = Math.abs(
    new Date(complaint1.createdAt) - new Date(complaint2.createdAt)
  ) / (1000 * 60 * 60); // hours
  const timeScore = calculateTimeProximityScore(timeDiff);

  // Combined weighted score
  const combinedScore = 
    (textSim.combined * CONFIG.weights.textSimilarity) +
    (geoScore * CONFIG.weights.geoProximity) +
    (categoryMatch * CONFIG.weights.categoryMatch) +
    (timeScore * CONFIG.weights.timeProximity);

  return {
    textSimilarity: textSim,
    geoProximity: Math.round(geoScore * 100) / 100,
    categoryMatch,
    timeProximity: Math.round(timeScore * 100) / 100,
    combinedScore: Math.round(combinedScore * 100) / 100,
    isDuplicate: combinedScore >= CONFIG.thresholds.combinedMin,
    isExactMatch: textSim.combined >= CONFIG.thresholds.exactMatch,
  };
};

/**
 * Main function to check for duplicates
 */
const checkForDuplicates = async (complaintData, options = {}) => {
  const {
    description,
    longitude,
    latitude,
    category,
  } = complaintData;

  const {
    radius = CONFIG.geo.radiusMeters,
    days = CONFIG.time.windowDays,
    threshold = CONFIG.thresholds.combinedMin,
  } = options;

  // Find nearby complaints
  const nearbyComplaints = await findNearbyComplaints(longitude, latitude, {
    radius,
    days,
    category,
  });

  if (nearbyComplaints.length === 0) {
    return {
      isDuplicate: false,
      potentialDuplicate: null,
      nearbyCount: 0,
      similarComplaints: [],
      checkDetails: {
        searchRadius: radius,
        timeWindow: days,
        complaintsChecked: 0,
      },
    };
  }

  // Calculate similarity with each nearby complaint
  const similarityResults = [];

  for (const existing of nearbyComplaints) {
    const score = calculateDuplicateScore(
      { description, location: { coordinates: [longitude, latitude] }, category: { primary: category }, createdAt: new Date() },
      existing
    );

    if (score.combinedScore > 0.3) { // Only include relevant matches
      similarityResults.push({
        complaintId: existing.complaintId,
        _id: existing._id,
        description: existing.description.slice(0, 100) + '...',
        category: existing.category?.primary,
        status: existing.status?.current,
        ...score,
      });
    }
  }

  // Sort by combined score descending
  similarityResults.sort((a, b) => b.combinedScore - a.combinedScore);

  // Find best match
  const bestMatch = similarityResults[0];
  const isDuplicate = bestMatch && bestMatch.combinedScore >= threshold;

  return {
    isDuplicate,
    potentialDuplicate: isDuplicate ? bestMatch._id : null,
    potentialDuplicateId: isDuplicate ? bestMatch.complaintId : null,
    nearbyCount: nearbyComplaints.length,
    similarComplaints: similarityResults.slice(0, 5), // Top 5 similar
    bestMatch: bestMatch || null,
    checkDetails: {
      searchRadius: radius,
      timeWindow: days,
      complaintsChecked: nearbyComplaints.length,
      threshold,
    },
  };
};

/**
 * Link duplicate complaints together
 */
const linkDuplicates = async (originalId, duplicateId) => {
  // Add duplicate to linked complaints of original
  await Complaint.findByIdAndUpdate(originalId, {
    $addToSet: { linkedComplaints: duplicateId },
  });

  // Mark new complaint as duplicate
  await Complaint.findByIdAndUpdate(duplicateId, {
    duplicateOf: originalId,
  });
};

/**
 * Find all duplicates/related complaints for a given complaint
 */
const findRelatedComplaints = async (complaintId) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) return { related: [], original: null };

  // If this is a duplicate, get the original
  let original = null;
  if (complaint.duplicateOf) {
    original = await Complaint.findById(complaint.duplicateOf)
      .select('complaintId description status category');
  }

  // Get all linked complaints
  const linked = await Complaint.find({
    $or: [
      { _id: { $in: complaint.linkedComplaints || [] } },
      { duplicateOf: complaintId },
    ],
  }).select('complaintId description status category createdAt');

  return {
    original,
    linked,
    totalRelated: linked.length + (original ? 1 : 0),
  };
};

/**
 * Batch duplicate check for multiple complaints
 */
const batchCheckDuplicates = async (complaints) => {
  const results = [];

  for (const complaint of complaints) {
    const result = await checkForDuplicates(complaint);
    results.push({
      ...complaint,
      duplicateCheck: result,
    });
  }

  return results;
};

/**
 * Get duplicate detection statistics
 */
const getDuplicateStats = async (days = 30) => {
  const startDate = new Date(Date.now() - days * TIME.MS_PER_DAY);

  const stats = await Complaint.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        duplicates: {
          $sum: { $cond: [{ $ne: ['$duplicateOf', null] }, 1, 0] },
        },
        withLinks: {
          $sum: {
            $cond: [{ $gt: [{ $size: { $ifNull: ['$linkedComplaints', []] } }, 0] }, 1, 0],
          },
        },
      },
    },
  ]);

  const result = stats[0] || { total: 0, duplicates: 0, withLinks: 0 };
  
  return {
    totalComplaints: result.total,
    duplicatesDetected: result.duplicates,
    complaintsWithLinks: result.withLinks,
    duplicateRate: result.total > 0 
      ? Math.round((result.duplicates / result.total) * 100) 
      : 0,
    periodDays: days,
  };
};

module.exports = {
  checkForDuplicates,
  calculateDuplicateScore,
  calculateTextSimilarity,
  findNearbyComplaints,
  linkDuplicates,
  findRelatedComplaints,
  batchCheckDuplicates,
  getDuplicateStats,
  CONFIG,
};
