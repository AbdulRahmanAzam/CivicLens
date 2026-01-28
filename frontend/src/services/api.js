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

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 errors - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${api.defaults.baseURL}/auth/refresh-token`,
            { refreshToken }
          );
          
          // Backend returns: { success, data: { accessToken, refreshToken } }
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Auth API endpoints
 */
export const authApi = {
  /**
   * Register a new user
   */
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    // Backend returns: { success, data: { user, tokens: { accessToken, refreshToken } } }
    const { user, tokens } = response.data.data;
    
    // Store tokens
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { user, ...tokens };
  },

  /**
   * Login user
   */
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    // Backend returns: { success, data: { user, tokens: { accessToken, refreshToken } } }
    const { user, tokens } = response.data.data;
    
    // Store tokens
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { user, ...tokens };
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  /**
   * Logout from all devices
   */
  logoutAll: async () => {
    try {
      await api.post('/auth/logout-all');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  /**
   * Get current user profile
   */
  getMe: async () => {
    const response = await api.get('/auth/me');
    // Backend returns: { success, data: { user } }
    return response.data.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data) => {
    const response = await api.patch('/auth/me', data);
    // Backend returns: { success, data: { user } }
    return response.data.data;
  },

  /**
   * Change password
   */
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.patch('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * Request password reset
   */
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token, newPassword) => {
    const response = await api.post(`/auth/reset-password/${token}`, {
      password: newPassword,
    });
    return response.data;
  },

  /**
   * Verify email
   */
  verifyEmail: async (token) => {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
  },

  /**
   * Resend verification email
   */
  resendVerification: async () => {
    const response = await api.post('/auth/resend-verification');
    return response.data;
  },

  /**
   * Get all users (Admin only)
   */
  getUsers: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.role) queryParams.append('role', params.role);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const response = await api.get(`/auth/users?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Create user (Admin only)
   */
  createUser: async (userData) => {
    const response = await api.post('/auth/users', userData);
    return response.data;
  },

  /**
   * Get user by ID (Admin only)
   */
  getUserById: async (id) => {
    const response = await api.get(`/auth/users/${id}`);
    return response.data;
  },

  /**
   * Update user (Admin only)
   */
  updateUser: async (id, data) => {
    const response = await api.patch(`/auth/users/${id}`, data);
    return response.data;
  },

  /**
   * Delete user (Admin only)
   */
  deleteUser: async (id) => {
    const response = await api.delete(`/auth/users/${id}`);
    return response.data;
  },
};

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

  /**
   * Get AI classification statistics
   * @returns {Promise} - AI stats object
   */
  getAIStats: async () => {
    const response = await api.get('/complaints/ai-stats');
    return response.data;
  },

  /**
   * Get global heatmap data
   * @returns {Promise} - Global heatmap data
   */
  getGlobalHeatmap: async () => {
    const response = await api.get('/complaints/heatmap/global');
    return response.data;
  },

  /**
   * Get profile-specific heatmap data
   * @param {string} entityId - UC or Town ID
   * @returns {Promise} - Profile heatmap data
   */
  getProfileHeatmap: async (entityId) => {
    const response = await api.get(`/complaints/heatmap/profile/${entityId}`);
    return response.data;
  },

  /**
   * Submit a new complaint
   * @param {Object} complaintData - Complaint data
   * @returns {Promise} - Created complaint
   */
  createComplaint: async (complaintData) => {
    const response = await api.post('/complaints', complaintData);
    return response.data;
  },

  /**
   * Update complaint status (Officer+)
   * @param {string} id - Complaint ID
   * @param {string} status - New status
   * @param {string} notes - Optional notes
   * @returns {Promise} - Updated complaint
   */
  updateStatus: async (id, status, notes = '') => {
    const response = await api.patch(`/complaints/${id}/status`, { status, notes });
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

  /**
   * Get list of all Cities
   * @returns {Promise} - Array of City objects
   */
  getCities: async () => {
    const response = await api.get('/territories/cities');
    return response.data;
  },

  /**
   * Get single territory by ID
   * @param {string} id - Territory ID
   * @returns {Promise} - Territory details
   */
  getTerritory: async (id) => {
    const response = await api.get(`/territories/${id}`);
    return response.data;
  },

  /**
   * Create new territory
   * @param {Object} data - Territory data (type, name, code, etc.)
   * @returns {Promise} - Created territory
   */
  createTerritory: async (data) => {
    const response = await api.post('/territories', data);
    return response.data;
  },

  /**
   * Update territory
   * @param {string} id - Territory ID
   * @param {Object} data - Updated data
   * @returns {Promise} - Updated territory
   */
  updateTerritory: async (id, data) => {
    const response = await api.put(`/territories/${id}`, data);
    return response.data;
  },

  /**
   * Delete (deactivate) territory
   * @param {string} id - Territory ID
   * @returns {Promise} - Success message
   */
  deleteTerritory: async (id) => {
    const response = await api.delete(`/territories/${id}`);
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

  /**
   * Get category statistics
   * @returns {Promise} - Category stats
   */
  getStats: async () => {
    const response = await api.get('/categories/stats');
    return response.data;
  },

  /**
   * Classify text using AI
   * @param {string} text - Text to classify
   * @returns {Promise} - Classification result
   */
  classifyText: async (text) => {
    const response = await api.post('/categories/classify', { text });
    return response.data;
  },

  /**
   * Get category by name
   * @param {string} name - Category name
   * @returns {Promise} - Category details
   */
  getByName: async (name) => {
    const response = await api.get(`/categories/${encodeURIComponent(name)}`);
    return response.data;
  },

  /**
   * Seed default categories (Admin only)
   * @returns {Promise} - Seeded categories
   */
  seedCategories: async () => {
    const response = await api.post('/categories/seed');
    return response.data;
  },
};

/**
 * Voice API endpoints
 */
export const voiceApi = {
  /**
   * Get speech service status
   * @returns {Promise} - Service status
   */
  getStatus: async () => {
    const response = await api.get('/voice/status');
    return response.data;
  },

  /**
   * Get supported languages
   * @returns {Promise} - Array of supported languages
   */
  getLanguages: async () => {
    const response = await api.get('/voice/languages');
    return response.data;
  },

  /**
   * Transcribe audio file
   * @param {File} audioFile - Audio file to transcribe
   * @param {string} language - Language code (optional)
   * @returns {Promise} - Transcription result
   */
  transcribe: async (audioFile, language = 'auto') => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('language', language);
    
    const response = await api.post('/voice/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Submit voice complaint
   * @param {File} audioFile - Audio file
   * @param {Object} metadata - Additional complaint data
   * @returns {Promise} - Created complaint
   */
  submitVoiceComplaint: async (audioFile, metadata = {}) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
      }
    });
    
    const response = await api.post('/voice/complaint', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

/**
 * WhatsApp API endpoints
 */
export const whatsappApi = {
  /**
   * Get WhatsApp connection status
   * @returns {Promise} - Connection status
   */
  getStatus: async () => {
    const response = await api.get('/whatsapp/status');
    return response.data;
  },

  /**
   * Send location request link
   * @param {string} phoneNumber - Phone number to send link to
   * @returns {Promise} - Response with link info
   */
  sendLocationLink: async (phoneNumber) => {
    const response = await api.post('/whatsapp/send-location-link', { phoneNumber });
    return response.data;
  },
};

/**
 * Health API
 */
export const healthApi = {
  /**
   * Check API health
   * @returns {Promise} - Health status
   */
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
