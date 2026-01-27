const mongoose = require('mongoose');

/**
 * Category Schema
 * Defines the complaint categories with metadata for classification
 */
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    enum: ['Roads', 'Water', 'Garbage', 'Electricity', 'Others'],
  },
  description: {
    type: String,
    trim: true,
  },
  keywords: [{
    type: String,
    lowercase: true,
    trim: true,
  }],
  department: {
    type: String,
    trim: true,
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3,
  },
  icon: {
    type: String,
    default: 'category-default',
  },
  color: {
    type: String,
    default: '#6B7280',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  avgResolutionTime: {
    type: Number, // in hours
    default: 72,
  },
  slaHours: {
    type: Number,
    default: 72, // Default SLA: 72 hours
  },
}, {
  timestamps: true,
});

// Index for faster lookups
// Note: name already has unique index from field definition
categorySchema.index({ isActive: 1 });

/**
 * Static method to seed default categories
 */
categorySchema.statics.seedDefaults = async function() {
  const defaultCategories = [
    {
      name: 'Roads',
      description: 'Issues related to roads, potholes, damaged pavements, traffic signals, street lights',
      keywords: ['road', 'pothole', 'pavement', 'traffic', 'signal', 'street light', 'footpath', 'divider', 'highway'],
      department: 'Public Works Department',
      priority: 4,
      icon: 'road',
      color: '#EF4444',
      slaHours: 48,
    },
    {
      name: 'Water',
      description: 'Water supply issues, pipeline leaks, drainage problems, sewage',
      keywords: ['water', 'pipe', 'leak', 'drainage', 'sewage', 'supply', 'tap', 'tank', 'flood', 'waterlogging'],
      department: 'Water Supply Department',
      priority: 5,
      icon: 'water',
      color: '#3B82F6',
      slaHours: 24,
    },
    {
      name: 'Garbage',
      description: 'Waste collection, garbage disposal, cleanliness issues',
      keywords: ['garbage', 'waste', 'trash', 'dump', 'cleanliness', 'sanitation', 'litter', 'debris', 'bin'],
      department: 'Sanitation Department',
      priority: 3,
      icon: 'trash',
      color: '#10B981',
      slaHours: 24,
    },
    {
      name: 'Electricity',
      description: 'Power supply issues, electrical hazards, transformer problems',
      keywords: ['electricity', 'power', 'light', 'transformer', 'wire', 'outage', 'voltage', 'meter', 'pole'],
      department: 'Electricity Board',
      priority: 4,
      icon: 'bolt',
      color: '#F59E0B',
      slaHours: 12,
    },
    {
      name: 'Others',
      description: 'Other civic issues not covered by specific categories',
      keywords: ['other', 'misc', 'general', 'encroachment', 'noise', 'pollution'],
      department: 'Municipal Corporation',
      priority: 2,
      icon: 'more',
      color: '#6B7280',
      slaHours: 96,
    },
  ];

  for (const category of defaultCategories) {
    await this.findOneAndUpdate(
      { name: category.name },
      category,
      { upsert: true, new: true }
    );
  }

  console.log('Default categories seeded successfully');
};

/**
 * Static method to classify complaint by keywords
 */
categorySchema.statics.classifyByKeywords = async function(text) {
  const categories = await this.find({ isActive: true });
  const lowerText = text.toLowerCase();
  
  let bestMatch = { category: 'Others', confidence: 0 };
  
  for (const category of categories) {
    let matchCount = 0;
    let totalKeywords = category.keywords.length;
    
    for (const keyword of category.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    
    const confidence = totalKeywords > 0 ? matchCount / totalKeywords : 0;
    
    if (confidence > bestMatch.confidence) {
      bestMatch = {
        category: category.name,
        confidence: Math.min(confidence * 2, 1), // Scale up confidence
      };
    }
  }
  
  // If no strong match, default to 'Others' with low confidence
  if (bestMatch.confidence < 0.1) {
    bestMatch = { category: 'Others', confidence: 0.1 };
  }
  
  return bestMatch;
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
