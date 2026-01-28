/**
 * useComplaints Hook
 * Fetches and manages complaints data for the map
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { complaintsApi } from '../../../services/api';
import { debounce, complaintsToHeatmapData } from '../../../utils/mapHelpers';

const useComplaints = (filters = {}, options = {}) => {
  const [complaints, setComplaints] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    byCategory: {},
    byStatus: {},
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
      const complaintsData = Array.isArray(response?.data?.complaints)
        ? response.data.complaints
        : Array.isArray(response?.complaints)
          ? response.complaints
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
              ? response
              : [];
      
      setComplaints(complaintsData);
      
      // Calculate stats
      const categoryCount = {};
      const statusCount = {};
      
      complaintsData.forEach(c => {
        // Count by category
        const cat = c.category?.primary || c.category || 'Other';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        
        // Count by status
        const status = c.status || 'reported';
        statusCount[status] = (statusCount[status] || 0) + 1;
      });
      
      setStats({
        total: complaintsData.length,
        byCategory: categoryCount,
        byStatus: statusCount,
      });

      // Generate heatmap data if enabled
      if (includeHeatmap) {
        const heatData = complaintsToHeatmapData(complaintsData);
        setHeatmapData(heatData);
      }

      return complaintsData;
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError(err.message || 'Failed to fetch complaints');
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
    if (!bounds) return complaints;
    
    return complaints.filter(c => {
      if (!c.location?.coordinates) return false;
      const [lng, lat] = c.location.coordinates;
      return bounds.contains([lat, lng]);
    });
  }, [complaints]);

  /**
   * Get complaints by category
   */
  const getComplaintsByCategory = useCallback((category) => {
    if (!category) return complaints;
    return complaints.filter(c => {
      const cat = c.category?.primary || c.category;
      return cat === category;
    });
  }, [complaints]);

  /**
   * Get complaint by ID
   */
  const getComplaintById = useCallback((id) => {
    return complaints.find(c => c._id === id || c.complaintId === id);
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
