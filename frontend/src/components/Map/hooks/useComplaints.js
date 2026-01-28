/**
 * useComplaints Hook
 * Fetches and manages complaints data for the map
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { complaintsApi } from '../../../services/api';
import { debounce, complaintsToHeatmapData } from '../../../utils/mapHelpers';

// Hardcoded test data for Karachi heatmap - centered around different areas
const TEST_HEATMAP_DATA = [
  // Clifton area - High density
  [24.8138, 67.0300, 0.9],
  [24.8145, 67.0310, 0.85],
  [24.8150, 67.0295, 0.8],
  [24.8155, 67.0305, 0.75],
  [24.8160, 67.0315, 0.7],
  [24.8142, 67.0320, 0.65],
  [24.8148, 67.0280, 0.6],
  
  // DHA area - Medium-High density
  [24.7970, 67.0500, 0.8],
  [24.7980, 67.0510, 0.75],
  [24.7960, 67.0490, 0.7],
  [24.7975, 67.0520, 0.65],
  [24.7985, 67.0480, 0.6],
  [24.7965, 67.0505, 0.55],
  
  // Saddar area - High density
  [24.8615, 67.0280, 0.95],
  [24.8620, 67.0290, 0.9],
  [24.8610, 67.0270, 0.85],
  [24.8625, 67.0300, 0.8],
  [24.8605, 67.0285, 0.75],
  [24.8630, 67.0275, 0.7],
  [24.8608, 67.0295, 0.65],
  
  // Gulshan-e-Iqbal - Medium density
  [24.9200, 67.0900, 0.7],
  [24.9210, 67.0910, 0.65],
  [24.9195, 67.0890, 0.6],
  [24.9205, 67.0920, 0.55],
  [24.9215, 67.0880, 0.5],
  
  // North Nazimabad - Medium density
  [24.9420, 67.0350, 0.65],
  [24.9430, 67.0360, 0.6],
  [24.9410, 67.0340, 0.55],
  [24.9425, 67.0370, 0.5],
  [24.9435, 67.0330, 0.45],
  
  // Korangi area - Medium-High density
  [24.8350, 67.1350, 0.75],
  [24.8360, 67.1360, 0.7],
  [24.8340, 67.1340, 0.65],
  [24.8355, 67.1370, 0.6],
  [24.8365, 67.1330, 0.55],
  
  // Malir area - Low-Medium density
  [24.8900, 67.2000, 0.5],
  [24.8910, 67.2010, 0.45],
  [24.8890, 67.1990, 0.4],
  [24.8905, 67.2020, 0.35],
  
  // Lyari area - High density
  [24.8550, 66.9900, 0.85],
  [24.8560, 66.9910, 0.8],
  [24.8540, 66.9890, 0.75],
  [24.8555, 66.9920, 0.7],
  [24.8565, 66.9880, 0.65],
  [24.8545, 66.9905, 0.6],
  
  // Orangi Town - High density
  [24.9650, 66.9850, 0.8],
  [24.9660, 66.9860, 0.75],
  [24.9640, 66.9840, 0.7],
  [24.9655, 66.9870, 0.65],
  [24.9665, 66.9830, 0.6],
  
  // SITE area - Medium density
  [24.9100, 67.0100, 0.6],
  [24.9110, 67.0110, 0.55],
  [24.9090, 67.0090, 0.5],
  [24.9105, 67.0120, 0.45],
  
  // Landhi area - Medium density
  [24.8450, 67.2200, 0.55],
  [24.8460, 67.2210, 0.5],
  [24.8440, 67.2190, 0.45],
  [24.8455, 67.2220, 0.4],
  
  // Federal B Area - Medium density
  [24.9300, 67.0500, 0.6],
  [24.9310, 67.0510, 0.55],
  [24.9290, 67.0490, 0.5],
  [24.9305, 67.0520, 0.45],
];

const useComplaints = (filters = {}, options = {}) => {
  // Initialize with test heatmap data
  const [complaints, setComplaints] = useState([]);
  const [heatmapData, setHeatmapData] = useState(TEST_HEATMAP_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: TEST_HEATMAP_DATA.length,
    byCategory: { 'Infrastructure': 25, 'Sanitation': 20, 'Roads': 18, 'Utilities': 15, 'Other': 7 },
    byStatus: { 'reported': 35, 'in_progress': 25, 'resolved': 25 },
  });

  const {
    autoFetch = true,
    debounceMs = 300,
    includeHeatmap = true,
  } = options;

  /**
   * Fetch complaints from API
   */
  const fetchComplaints = useCallback(async (filterParams = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await complaintsApi.getComplaints(filterParams);
      
      // Safely extract complaints data - handle various API response formats
      let complaintsData = [];
      if (Array.isArray(response)) {
        complaintsData = response;
      } else if (response && Array.isArray(response.complaints)) {
        complaintsData = response.complaints;
      } else if (response && Array.isArray(response.data)) {
        complaintsData = response.data;
      } else if (response && typeof response === 'object') {
        // If response is an object but data isn't an array, try to extract array values
        complaintsData = [];
      }
      
      setComplaints(complaintsData);
      
      // Calculate stats - ensure we have an array before iterating
      const categoryCount = {};
      const statusCount = {};
      
      if (Array.isArray(complaintsData)) {
        complaintsData.forEach(c => {
          // Count by category
          const cat = c.category?.primary || c.category || 'Other';
          categoryCount[cat] = (categoryCount[cat] || 0) + 1;
          
          // Count by status
          const status = c.status || 'reported';
          statusCount[status] = (statusCount[status] || 0) + 1;
        });
      }
      
      setStats({
        total: complaintsData.length,
        byCategory: categoryCount,
        byStatus: statusCount,
      });

      // Generate heatmap data if enabled
      if (includeHeatmap && Array.isArray(complaintsData)) {
        const heatData = complaintsToHeatmapData(complaintsData);
        // Use API data if available, otherwise keep test data
        setHeatmapData(heatData.length > 0 ? heatData : TEST_HEATMAP_DATA);
      }

      return complaintsData;
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError(err.message || 'Failed to fetch complaints');
      setComplaints([]);
      // Keep test heatmap data even when API fails
      setHeatmapData(TEST_HEATMAP_DATA);
      return [];
    } finally {
      setLoading(false);
    }
  }, [includeHeatmap]);

  /**
   * Fetch heatmap data separately (for lightweight loading)
   */
  const fetchHeatmapData = useCallback(async (filterParams = {}) => {
    try {
      const response = await complaintsApi.getHeatmapData(filterParams);
      const heatData = response.heatmap || response.data || [];
      setHeatmapData(heatData);
      return heatData;
    } catch (err) {
      console.error('Error fetching heatmap data:', err);
      // Fallback to calculating from complaints
      if (complaints.length > 0) {
        const heatData = complaintsToHeatmapData(complaints);
        setHeatmapData(heatData);
        return heatData;
      }
      return [];
    }
  }, [complaints]);

  /**
   * Debounced fetch for filter changes
   */
  const debouncedFetch = useMemo(
    () => debounce(fetchComplaints, debounceMs),
    [fetchComplaints, debounceMs]
  );

  /**
   * Get complaints within map bounds
   */
  const getComplaintsInBounds = useCallback((bounds) => {
    // Ensure complaints is always an array
    const complaintsArray = Array.isArray(complaints) ? complaints : [];
    if (!bounds) return complaintsArray;
    
    return complaintsArray.filter(c => {
      if (!c.location?.coordinates) return false;
      const [lng, lat] = c.location.coordinates;
      return bounds.contains([lat, lng]);
    });
  }, [complaints]);

  /**
   * Get complaints by category
   */
  const getComplaintsByCategory = useCallback((category) => {
    // Ensure complaints is always an array
    const complaintsArray = Array.isArray(complaints) ? complaints : [];
    if (!category) return complaintsArray;
    return complaintsArray.filter(c => {
      const cat = c.category?.primary || c.category;
      return cat === category;
    });
  }, [complaints]);

  /**
   * Get complaint by ID
   */
  const getComplaintById = useCallback((id) => {
    // Ensure complaints is always an array
    const complaintsArray = Array.isArray(complaints) ? complaints : [];
    return complaintsArray.find(c => c._id === id || c.complaintId === id);
  }, [complaints]);

  /**
   * Refresh data
   */
  const refresh = useCallback(() => {
    return fetchComplaints(filters);
  }, [fetchComplaints, filters]);

  // Auto-fetch on mount and filter changes
  useEffect(() => {
    if (autoFetch) {
      debouncedFetch(filters);
    }
    // Set loading to false after initial mount to show test data
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [autoFetch, filters, debouncedFetch]);

  return {
    complaints,
    heatmapData,
    loading,
    error,
    stats,
    fetchComplaints,
    fetchHeatmapData,
    getComplaintsInBounds,
    getComplaintsByCategory,
    getComplaintById,
    refresh,
  };
};

export default useComplaints;
