const { Complaint } = require('../models');
const { TIME } = require('../utils/constants');

/**
 * Severity Scoring Service
 * Rule-based severity calculation with multiple weighted factors
 * ZERO API COST - Pure algorithmic scoring
 */

/**
 * Configuration for severity scoring
 */
const CONFIG = {
  // Factor weights (must sum to 1.0)
  weights: {
    frequency: 0.30,      // Number of similar complaints in area
    duration: 0.25,       // How long issue persists
    categoryUrgency: 0.20, // Base urgency by category
    areaImpact: 0.15,     // Population/area impact
    citizenUrgency: 0.10, // Citizen-reported urgency
  },
  
  // Category base urgency scores (1-10)
  categoryScores: {
    Water: 8,        // Essential service
    Electricity: 8,  // Safety hazard potential
    Roads: 6,        // Traffic safety
    Garbage: 5,      // Health/hygiene
    Others: 4,       // Variable
  },
  
  // Frequency thresholds
  frequency: {
    radiusMeters: 500,
    windowDays: 7,
    thresholds: {
      critical: 10,  // >= 10 complaints = critical
      high: 5,       // >= 5 complaints = high
      medium: 2,     // >= 2 complaints = medium
      low: 1,        // 1 complaint = low
    },
  },
  
  // Duration thresholds (in hours)
  duration: {
    critical: 168,   // > 7 days
    high: 72,        // > 3 days
    medium: 24,      // > 1 day
    low: 0,          // new
  },
  
  // Severity score ranges
  priority: {
    critical: { min: 8, label: 'critical', color: '#DC2626' },
    high: { min: 6, label: 'high', color: '#F59E0B' },
    medium: { min: 4, label: 'medium', color: '#3B82F6' },
    low: { min: 0, label: 'low', color: '#10B981' },
  },
};

/**
 * Urgency keywords that boost severity
 */
const URGENCY_KEYWORDS = {
  critical: {
    keywords: ['emergency', 'life-threatening', 'danger', 'collapse', 'fire', 'electrocution', 'drowning', 'accident', 'death'],
    boost: 3.0,
  },
  high: {
    keywords: ['urgent', 'hazard', 'unsafe', 'risk', 'injured', 'children', 'elderly', 'hospital', 'school', 'flooding'],
    boost: 2.0,
  },
  medium: {
    keywords: ['broken', 'damaged', 'not working', 'leaking', 'blocked', 'overflow'],
    boost: 1.0,
  },
};

/**
 * Area impact factors (can be customized based on actual area data)
 */
const AREA_IMPACT_FACTORS = {
  // Default multipliers based on area type
  residential: 1.0,
  commercial: 0.9,
  industrial: 0.7,
  educational: 1.2,  // Schools, colleges
  hospital: 1.3,     // Healthcare facilities
  slum: 1.1,         // Underserved areas
};

/**
 * Calculate frequency score based on nearby complaints
 */
const calculateFrequencyScore = async (longitude, latitude, category, excludeId = null) => {
  const { radiusMeters, windowDays, thresholds } = CONFIG.frequency;
  
  const query = {
    location: {
      $geoWithin: {
        $centerSphere: [[longitude, latitude], radiusMeters / 6371000],
      },
    },
    createdAt: {
      $gte: new Date(Date.now() - windowDays * TIME.MS_PER_DAY),
    },
    'category.primary': category,
    'status.current': { $nin: ['resolved', 'closed'] },
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const count = await Complaint.countDocuments(query);
  
  // Calculate score (1-10)
  let score;
  if (count >= thresholds.critical) {
    score = 10;
  } else if (count >= thresholds.high) {
    score = 7 + ((count - thresholds.high) / (thresholds.critical - thresholds.high)) * 2;
  } else if (count >= thresholds.medium) {
    score = 4 + ((count - thresholds.medium) / (thresholds.high - thresholds.medium)) * 3;
  } else {
    score = 1 + (count / thresholds.medium) * 3;
  }

  return {
    score: Math.round(score * 10) / 10,
    count,
    radius: radiusMeters,
    window: windowDays,
  };
};

/**
 * Calculate duration score based on how long issue persists
 */
const calculateDurationScore = (firstReportedAt, currentTime = new Date()) => {
  const hoursSinceFirst = (currentTime - new Date(firstReportedAt)) / TIME.MS_PER_HOUR;
  
  let score;
  if (hoursSinceFirst >= CONFIG.duration.critical) {
    score = 10;
  } else if (hoursSinceFirst >= CONFIG.duration.high) {
    score = 7 + ((hoursSinceFirst - CONFIG.duration.high) / (CONFIG.duration.critical - CONFIG.duration.high)) * 3;
  } else if (hoursSinceFirst >= CONFIG.duration.medium) {
    score = 4 + ((hoursSinceFirst - CONFIG.duration.medium) / (CONFIG.duration.high - CONFIG.duration.medium)) * 3;
  } else {
    score = 1 + (hoursSinceFirst / CONFIG.duration.medium) * 3;
  }

  return {
    score: Math.round(score * 10) / 10,
    hours: Math.round(hoursSinceFirst),
    days: Math.round(hoursSinceFirst / 24 * 10) / 10,
  };
};

/**
 * Get category base urgency score
 */
const getCategoryUrgencyScore = (category) => {
  return CONFIG.categoryScores[category] || CONFIG.categoryScores.Others;
};

/**
 * Calculate area impact score based on location type
 */
const calculateAreaImpactScore = (areaType = 'residential', additionalFactors = {}) => {
  let baseMultiplier = AREA_IMPACT_FACTORS[areaType] || 1.0;
  
  // Additional factors can boost the score
  if (additionalFactors.nearSchool) baseMultiplier *= 1.15;
  if (additionalFactors.nearHospital) baseMultiplier *= 1.2;
  if (additionalFactors.highTraffic) baseMultiplier *= 1.1;
  if (additionalFactors.mainRoad) baseMultiplier *= 1.05;
  
  // Normalize to 1-10 scale
  const score = Math.min(5 * baseMultiplier, 10);
  
  return {
    score: Math.round(score * 10) / 10,
    areaType,
    multiplier: baseMultiplier,
  };
};

/**
 * Calculate citizen urgency score from description
 */
const calculateCitizenUrgencyScore = (description, reportedUrgency = null) => {
  const lowerDesc = (description || '').toLowerCase();
  let score = 5; // Default medium urgency
  let matchedKeywords = [];
  
  // Check for urgency keywords
  for (const [level, { keywords, boost }] of Object.entries(URGENCY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword)) {
        score = Math.max(score, 5 + boost);
        matchedKeywords.push({ keyword, level });
      }
    }
  }
  
  // If citizen explicitly reported urgency, factor it in
  if (reportedUrgency) {
    const urgencyMap = { low: 3, medium: 5, high: 7, critical: 9 };
    const citizenScore = urgencyMap[reportedUrgency] || 5;
    score = (score + citizenScore) / 2;
  }
  
  return {
    score: Math.min(Math.round(score * 10) / 10, 10),
    matchedKeywords,
    reportedUrgency,
  };
};

/**
 * Main severity calculation function
 */
const calculateSeverity = async (complaintData, options = {}) => {
  const {
    description,
    category,
    longitude,
    latitude,
    createdAt = new Date(),
    reportedUrgency = null,
    areaType = 'residential',
    areaFactors = {},
    _id = null,
  } = complaintData;

  const {
    includeFrequency = true,
    includeDuration = true,
  } = options;

  // Calculate individual factor scores
  const factors = {};

  // 1. Frequency score (async - requires DB query)
  if (includeFrequency && longitude && latitude) {
    factors.frequency = await calculateFrequencyScore(longitude, latitude, category, _id);
  } else {
    factors.frequency = { score: 5, count: 0, skipped: true };
  }

  // 2. Duration score
  if (includeDuration) {
    factors.duration = calculateDurationScore(createdAt);
  } else {
    factors.duration = { score: 1, hours: 0, skipped: true };
  }

  // 3. Category urgency
  factors.categoryUrgency = {
    score: getCategoryUrgencyScore(category),
    category,
  };

  // 4. Area impact
  factors.areaImpact = calculateAreaImpactScore(areaType, areaFactors);

  // 5. Citizen urgency
  factors.citizenUrgency = calculateCitizenUrgencyScore(description, reportedUrgency);

  // Calculate weighted score
  const weightedScore = 
    (factors.frequency.score * CONFIG.weights.frequency) +
    (factors.duration.score * CONFIG.weights.duration) +
    (factors.categoryUrgency.score * CONFIG.weights.categoryUrgency) +
    (factors.areaImpact.score * CONFIG.weights.areaImpact) +
    (factors.citizenUrgency.score * CONFIG.weights.citizenUrgency);

  // Normalize to 1-10 scale and round
  const finalScore = Math.min(Math.max(Math.round(weightedScore * 10) / 10, 1), 10);

  // Determine priority level
  let priority;
  if (finalScore >= CONFIG.priority.critical.min) {
    priority = CONFIG.priority.critical;
  } else if (finalScore >= CONFIG.priority.high.min) {
    priority = CONFIG.priority.high;
  } else if (finalScore >= CONFIG.priority.medium.min) {
    priority = CONFIG.priority.medium;
  } else {
    priority = CONFIG.priority.low;
  }

  return {
    score: finalScore,
    priority: priority.label,
    color: priority.color,
    factors: {
      frequency: factors.frequency.score,
      duration: factors.duration.score,
      categoryUrgency: factors.categoryUrgency.score,
      areaImpact: factors.areaImpact.score,
      citizenUrgency: factors.citizenUrgency.score,
    },
    details: factors,
    weights: CONFIG.weights,
    calculatedAt: new Date(),
  };
};

/**
 * Quick severity calculation without database queries (for initial estimate)
 */
const calculateQuickSeverity = (complaintData) => {
  const {
    description,
    category,
    reportedUrgency = null,
  } = complaintData;

  // Get base scores
  const categoryScore = getCategoryUrgencyScore(category);
  const citizenScore = calculateCitizenUrgencyScore(description, reportedUrgency);

  // Simple weighted average
  const score = (categoryScore * 0.6) + (citizenScore.score * 0.4);
  const finalScore = Math.min(Math.max(Math.round(score * 10) / 10, 1), 10);

  // Determine priority
  let priority;
  if (finalScore >= CONFIG.priority.critical.min) {
    priority = 'critical';
  } else if (finalScore >= CONFIG.priority.high.min) {
    priority = 'high';
  } else if (finalScore >= CONFIG.priority.medium.min) {
    priority = 'medium';
  } else {
    priority = 'low';
  }

  return {
    score: finalScore,
    priority,
    isQuickEstimate: true,
    factors: {
      categoryUrgency: categoryScore,
      citizenUrgency: citizenScore.score,
    },
  };
};

/**
 * Recalculate severity for an existing complaint
 */
const recalculateSeverity = async (complaintId) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    throw new Error('Complaint not found');
  }

  const severity = await calculateSeverity({
    description: complaint.description,
    category: complaint.category.primary,
    longitude: complaint.location.coordinates[0],
    latitude: complaint.location.coordinates[1],
    createdAt: complaint.createdAt,
    _id: complaint._id,
  });

  // Update complaint with new severity
  complaint.severity = {
    score: severity.score,
    factors: severity.factors,
  };

  await complaint.save();

  return severity;
};

/**
 * Batch recalculate severity for multiple complaints
 */
const batchRecalculateSeverity = async (filter = {}) => {
  const complaints = await Complaint.find({
    'status.current': { $nin: ['resolved', 'closed'] },
    ...filter,
  }).select('_id description category location createdAt');

  const results = [];
  
  for (const complaint of complaints) {
    try {
      const severity = await recalculateSeverity(complaint._id);
      results.push({
        complaintId: complaint._id,
        newSeverity: severity.score,
        priority: severity.priority,
        success: true,
      });
    } catch (error) {
      results.push({
        complaintId: complaint._id,
        error: error.message,
        success: false,
      });
    }
  }

  return {
    processed: results.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
};

/**
 * Get severity distribution statistics
 */
const getSeverityStats = async (days = 30) => {
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
        avgSeverity: { $avg: '$severity.score' },
        maxSeverity: { $max: '$severity.score' },
        minSeverity: { $min: '$severity.score' },
        critical: {
          $sum: { $cond: [{ $gte: ['$severity.score', 8] }, 1, 0] },
        },
        high: {
          $sum: {
            $cond: [
              { $and: [{ $gte: ['$severity.score', 6] }, { $lt: ['$severity.score', 8] }] },
              1,
              0,
            ],
          },
        },
        medium: {
          $sum: {
            $cond: [
              { $and: [{ $gte: ['$severity.score', 4] }, { $lt: ['$severity.score', 6] }] },
              1,
              0,
            ],
          },
        },
        low: {
          $sum: { $cond: [{ $lt: ['$severity.score', 4] }, 1, 0] },
        },
        total: { $sum: 1 },
      },
    },
  ]);

  const result = stats[0] || {
    avgSeverity: 0,
    maxSeverity: 0,
    minSeverity: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: 0,
  };

  return {
    average: Math.round(result.avgSeverity * 10) / 10,
    max: result.maxSeverity,
    min: result.minSeverity,
    distribution: {
      critical: result.critical,
      high: result.high,
      medium: result.medium,
      low: result.low,
    },
    total: result.total,
    periodDays: days,
  };
};

module.exports = {
  calculateSeverity,
  calculateQuickSeverity,
  recalculateSeverity,
  batchRecalculateSeverity,
  getSeverityStats,
  calculateFrequencyScore,
  calculateDurationScore,
  calculateCitizenUrgencyScore,
  calculateAreaImpactScore,
  getCategoryUrgencyScore,
  CONFIG,
};
