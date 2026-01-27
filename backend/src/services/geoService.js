const env = require('../config/env');

/**
 * Geo Service
 * Handles reverse geocoding and location-based operations
 */
class GeoService {
  constructor() {
    this.apiKey = env.googleMapsApiKey;
    this.baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
  }

  /**
   * Reverse geocode coordinates to get address details
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Object} - Location details
   */
  async reverseGeocode(latitude, longitude) {
    // If no API key is configured, return placeholder data
    if (!this.apiKey) {
      console.warn('Google Maps API key not configured. Using placeholder location data.');
      return this.getPlaceholderLocation(latitude, longitude);
    }

    try {
      const url = `${this.baseUrl}?latlng=${latitude},${longitude}&key=${this.apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        return this.parseGeocodingResult(data.results[0], latitude, longitude);
      }

      // Fallback to placeholder if geocoding fails
      console.warn('Geocoding returned no results. Using placeholder data.');
      return this.getPlaceholderLocation(latitude, longitude);
    } catch (error) {
      console.error('Geocoding error:', error.message);
      return this.getPlaceholderLocation(latitude, longitude);
    }
  }

  /**
   * Parse Google Maps geocoding result
   */
  parseGeocodingResult(result, latitude, longitude) {
    const components = result.address_components || [];
    const location = {
      type: 'Point',
      coordinates: [longitude, latitude],
      address: result.formatted_address || '',
      area: '',
      ward: '',
      pincode: '',
    };

    // Extract address components
    for (const component of components) {
      const types = component.types || [];
      
      if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
        location.area = component.long_name;
      }
      
      if (types.includes('administrative_area_level_3') || types.includes('locality')) {
        if (!location.area) {
          location.area = component.long_name;
        }
      }
      
      if (types.includes('postal_code')) {
        location.pincode = component.long_name;
      }
      
      // Ward extraction (varies by region)
      if (types.includes('administrative_area_level_4')) {
        location.ward = component.long_name;
      }
    }

    return location;
  }

  /**
   * Generate placeholder location data when geocoding is unavailable
   */
  getPlaceholderLocation(latitude, longitude) {
    return {
      type: 'Point',
      coordinates: [longitude, latitude],
      address: `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      area: 'Unknown Area',
      ward: '',
      pincode: '',
    };
  }

  /**
   * Calculate distance between two points (Haversine formula)
   * @param {number} lat1 - Latitude of first point
   * @param {number} lon1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lon2 - Longitude of second point
   * @returns {number} - Distance in meters
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
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
   * Check if a point is within a radius of another point
   */
  isWithinRadius(centerLat, centerLon, pointLat, pointLon, radiusMeters) {
    const distance = this.calculateDistance(centerLat, centerLon, pointLat, pointLon);
    return distance <= radiusMeters;
  }

  /**
   * Get bounding box for a center point and radius
   * Useful for initial filtering before precise distance calculation
   */
  getBoundingBox(latitude, longitude, radiusMeters) {
    const latDelta = radiusMeters / 111000; // ~111km per degree of latitude
    const lonDelta = radiusMeters / (111000 * Math.cos(this.toRadians(latitude)));

    return {
      minLat: latitude - latDelta,
      maxLat: latitude + latDelta,
      minLon: longitude - lonDelta,
      maxLon: longitude + lonDelta,
    };
  }

  /**
   * Generate grid points for heatmap clustering
   */
  generateGridCenters(bounds, gridSize = 10) {
    const { minLat, maxLat, minLon, maxLon } = bounds;
    const latStep = (maxLat - minLat) / gridSize;
    const lonStep = (maxLon - minLon) / gridSize;
    
    const centers = [];
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        centers.push({
          lat: minLat + (i + 0.5) * latStep,
          lng: minLon + (j + 0.5) * lonStep,
        });
      }
    }
    
    return centers;
  }
}

// Export singleton instance
module.exports = new GeoService();
