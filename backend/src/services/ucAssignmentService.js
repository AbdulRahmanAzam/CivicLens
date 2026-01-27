/**
 * UC Assignment Service
 * Handles automatic UC assignment for complaints via geo-fencing
 */

const { UC, Town, City, Category } = require('../models');

class UCAssignmentService {
  /**
   * Assign a complaint to a UC based on location
   * Priority: 1. Geo-fence match  2. Nearest UC  3. Manual fallback
   * 
   * @param {number} longitude - Complaint longitude
   * @param {number} latitude - Complaint latitude
   * @param {Object} options - Optional: cityId, townId for filtering
   * @returns {Object} Assignment result with UC, Town, City refs
   */
  async assignByLocation(longitude, latitude, options = {}) {
    console.log(`[UCAssignment] Assigning complaint at [${longitude}, ${latitude}]`);

    // Step 1: Try exact geo-fence match
    let assignment = await this.findByGeoFence(longitude, latitude);
    
    if (assignment.uc) {
      console.log(`[UCAssignment] Geo-fence match: UC ${assignment.uc.name}`);
      return {
        ...assignment,
        method: 'geo_fence',
        confidence: 'exact',
      };
    }

    // Step 2: Find nearest UC
    console.log(`[UCAssignment] No geo-fence match, finding nearest UC...`);
    assignment = await this.findNearest(longitude, latitude, options);
    
    if (assignment.uc) {
      console.log(`[UCAssignment] Nearest match: UC ${assignment.uc.name} (${assignment.distance}m away)`);
      return {
        ...assignment,
        method: 'nearest',
        confidence: this.getConfidenceLevel(assignment.distance),
      };
    }

    // Step 3: No UC found - return error
    console.log(`[UCAssignment] No UC found for location`);
    return {
      uc: null,
      town: null,
      city: null,
      method: 'none',
      confidence: 'none',
      error: 'No UC found for the given location. Please select a UC manually.',
    };
  }

  /**
   * Find UC by geo-fence (exact boundary match)
   */
  async findByGeoFence(longitude, latitude) {
    const uc = await UC.findOne({
      boundary: {
        $geoIntersects: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
        },
      },
      isActive: true,
    }).populate('town', 'name code').populate('city', 'name code');

    if (uc) {
      return {
        uc,
        town: uc.town,
        city: uc.city,
        ucId: uc._id,
        townId: uc.town._id,
        cityId: uc.city._id,
      };
    }

    return { uc: null, town: null, city: null };
  }

  /**
   * Find nearest UC to a location
   */
  async findNearest(longitude, latitude, options = {}) {
    const query = {
      center: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: options.maxDistance || 20000, // 20km default
        },
      },
      isActive: true,
    };

    // Filter by city if provided
    if (options.cityId) {
      query.city = options.cityId;
    }

    // Filter by town if provided
    if (options.townId) {
      query.town = options.townId;
    }

    const uc = await UC.findOne(query)
      .populate('town', 'name code')
      .populate('city', 'name code');

    if (uc) {
      // Calculate distance
      const distance = this.calculateDistance(
        longitude, latitude,
        uc.center.coordinates[0], uc.center.coordinates[1]
      );

      return {
        uc,
        town: uc.town,
        city: uc.city,
        ucId: uc._id,
        townId: uc.town._id,
        cityId: uc.city._id,
        distance: Math.round(distance),
      };
    }

    return { uc: null, town: null, city: null };
  }

  /**
   * Get all UCs near a location for manual selection
   */
  async getNearbyUCs(longitude, latitude, limit = 10) {
    const ucs = await UC.find({
      center: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: 50000, // 50km
        },
      },
      isActive: true,
    })
      .limit(limit)
      .populate('town', 'name code')
      .populate('city', 'name code');

    return ucs.map(uc => {
      const distance = this.calculateDistance(
        longitude, latitude,
        uc.center.coordinates[0], uc.center.coordinates[1]
      );

      return {
        uc: {
          _id: uc._id,
          name: uc.name,
          code: uc.code,
          ucNumber: uc.ucNumber,
        },
        town: {
          _id: uc.town._id,
          name: uc.town.name,
          code: uc.town.code,
        },
        city: {
          _id: uc.city._id,
          name: uc.city.name,
          code: uc.city.code,
        },
        distance: Math.round(distance),
        confidence: this.getConfidenceLevel(distance),
      };
    });
  }

  /**
   * Validate manual UC selection
   */
  async validateManualSelection(ucId, longitude, latitude) {
    const uc = await UC.findById(ucId)
      .populate('town')
      .populate('city');

    if (!uc) {
      return { valid: false, error: 'UC not found' };
    }

    if (!uc.isActive) {
      return { valid: false, error: 'UC is not active' };
    }

    // Calculate distance for warning
    const distance = this.calculateDistance(
      longitude, latitude,
      uc.center.coordinates[0], uc.center.coordinates[1]
    );

    // Warn if location is far from selected UC
    const warning = distance > 10000 
      ? `Location is ${Math.round(distance / 1000)}km away from selected UC` 
      : null;

    return {
      valid: true,
      uc,
      town: uc.town,
      city: uc.city,
      ucId: uc._id,
      townId: uc.town._id,
      cityId: uc.town.city,
      distance,
      warning,
    };
  }

  /**
   * Get SLA deadline based on category
   */
  async calculateSLADeadline(categoryName) {
    const category = await Category.findOne({ name: categoryName, isActive: true });
    const slaHours = category?.slaHours || 72; // Default 72 hours
    
    const deadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);
    
    return {
      deadline,
      targetHours: slaHours,
      categoryName,
    };
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(lon1, lat1, lon2, lat2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get confidence level based on distance
   */
  getConfidenceLevel(distanceMeters) {
    if (distanceMeters < 500) return 'exact';
    if (distanceMeters < 2000) return 'high';
    if (distanceMeters < 5000) return 'medium';
    return 'low';
  }

  /**
   * Get hierarchy tree (City → Town → UC)
   */
  async getHierarchyTree(cityId = null) {
    const query = cityId ? { _id: cityId } : {};
    
    const cities = await City.find({ ...query, isActive: true })
      .select('name code')
      .lean();

    const result = [];

    for (const city of cities) {
      const towns = await Town.find({ city: city._id, isActive: true })
        .select('name code')
        .lean();

      const townData = [];
      for (const town of towns) {
        const ucs = await UC.find({ town: town._id, isActive: true })
          .select('name code ucNumber chairman')
          .populate('chairman', 'name email')
          .lean();

        townData.push({
          ...town,
          ucs: ucs.map(uc => ({
            ...uc,
            hasChairman: !!uc.chairman,
          })),
        });
      }

      result.push({
        ...city,
        towns: townData,
      });
    }

    return result;
  }

  /**
   * Check if a point is within city boundaries
   */
  async isWithinCity(longitude, latitude, cityId) {
    const city = await City.findOne({
      _id: cityId,
      boundary: {
        $geoIntersects: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
        },
      },
    });

    return !!city;
  }

  /**
   * Get assignment statistics
   */
  async getAssignmentStats(days = 30) {
    const { Complaint } = require('../models');
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const stats = await Complaint.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$ucAssignment.method',
          count: { $sum: 1 },
        },
      },
    ]);

    const confidenceStats = await Complaint.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$ucAssignment.confidence',
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      byMethod: stats.reduce((acc, s) => {
        acc[s._id || 'unknown'] = s.count;
        return acc;
      }, {}),
      byConfidence: confidenceStats.reduce((acc, s) => {
        acc[s._id || 'unknown'] = s.count;
        return acc;
      }, {}),
      period: `${days} days`,
    };
  }
}

module.exports = new UCAssignmentService();
