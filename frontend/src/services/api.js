/**
 * API Service for CivicLens
 * Handles all HTTP requests to the backend
 */

import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Token expired, could redirect to login
      console.warn('Authentication error');
    }
    return Promise.reject(error);
  }
);

/**
 * Complaint API endpoints
 */
export const complaintsApi = {
  /**
   * Fetch complaints with optional filters
   * @param {Object} filters - Query parameters for filtering
   * @returns {Promise} - Array of complaints
   */
  getComplaints: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.severity_min) params.append('severity_min', filters.severity_min);
    if (filters.severity_max) params.append('severity_max', filters.severity_max);
    if (filters.status) params.append('status', filters.status);
    if (filters.uc_id) params.append('uc_id', filters.uc_id);
    if (filters.town) params.append('town', filters.town);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.bounds) {
      params.append('sw_lat', filters.bounds.sw_lat);
      params.append('sw_lng', filters.bounds.sw_lng);
      params.append('ne_lat', filters.bounds.ne_lat);
      params.append('ne_lng', filters.bounds.ne_lng);
    }
    
    const response = await api.get(`/complaints?${params.toString()}`);
    return response.data;
  },

  /**
   * Fetch heatmap-optimized data
   * @param {Object} filters - Optional filters
   * @returns {Promise} - Array of [lat, lng, intensity]
   */
  getHeatmapData: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.severity_min) params.append('severity_min', filters.severity_min);
    if (filters.status) params.append('status', filters.status);
    if (filters.bounds) {
      params.append('sw_lat', filters.bounds.sw_lat);
      params.append('sw_lng', filters.bounds.sw_lng);
      params.append('ne_lat', filters.bounds.ne_lat);
      params.append('ne_lng', filters.bounds.ne_lng);
    }
    
    const response = await api.get(`/complaints/heatmap?${params.toString()}`);
    return response.data;
  },

  /**
   * Get complaint by ID
   * @param {string} id - Complaint ID
   * @returns {Promise} - Single complaint object
   */
  getComplaintById: async (id) => {
    const response = await api.get(`/complaints/${id}`);
    return response.data;
  },

  /**
   * Get complaint statistics
   * @param {Object} filters - Optional filters
   * @returns {Promise} - Statistics object
   */
  getStats: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.uc_id) params.append('uc_id', filters.uc_id);
    if (filters.town) params.append('town', filters.town);
    
    const response = await api.get(`/complaints/stats?${params.toString()}`);
    return response.data;
  },
};

/**
 * Territory API endpoints
 */
export const territoriesApi = {
  /**
   * Fetch territory boundaries (UC/Town)
   * @param {Object} params - Query parameters
   * @returns {Promise} - GeoJSON territories
   */
  getTerritories: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.level) queryParams.append('level', params.level);
    if (params.city) queryParams.append('city', params.city);
    if (params.town) queryParams.append('town', params.town);
    
    const response = await api.get(`/territories?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Fetch UC boundaries
   * @param {string} city - City name
   * @returns {Promise} - GeoJSON UC boundaries
   */
  getUCBoundaries: async (city = 'Karachi') => {
    const response = await api.get(`/territories?level=UC&city=${city}`);
    return response.data;
  },

  /**
   * Fetch Town boundaries
   * @param {string} city - City name
   * @returns {Promise} - GeoJSON Town boundaries
   */
  getTownBoundaries: async (city = 'Karachi') => {
    const response = await api.get(`/territories?level=Town&city=${city}`);
    return response.data;
  },

  /**
   * Get list of all UCs
   * @returns {Promise} - Array of UC objects
   */
  getUCList: async () => {
    const response = await api.get('/territories/ucs');
    return response.data;
  },

  /**
   * Get list of all Towns
   * @returns {Promise} - Array of Town objects
   */
  getTownList: async () => {
    const response = await api.get('/territories/towns');
    return response.data;
  },
};

/**
 * Categories API
 */
export const categoriesApi = {
  /**
   * Get all complaint categories
   * @returns {Promise} - Array of categories
   */
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
};

export default api;
