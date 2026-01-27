/**
 * HeatmapLayer Component
 * Renders complaint density heatmap using leaflet.heat
 */

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { HEATMAP_CONFIG } from '../../utils/mapHelpers';

const HeatmapLayer = ({ 
  data = [], 
  visible = true,
  options = {},
}) => {
  const map = useMap();
  const heatLayerRef = useRef(null);

  // Merge default config with custom options
  const config = {
    ...HEATMAP_CONFIG,
    ...options,
  };

  useEffect(() => {
    if (!map) return;

    // Remove existing layer if any
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    // Don't create layer if not visible or no data
    if (!visible || !data || data.length === 0) return;

    // Create heat layer
    const heatLayer = L.heatLayer(data, {
      radius: config.radius,
      blur: config.blur,
      maxZoom: config.maxZoom,
      max: config.max,
      minOpacity: config.minOpacity,
      gradient: config.gradient,
    });

    // Add to map
    heatLayer.addTo(map);
    heatLayerRef.current = heatLayer;

    // Cleanup on unmount
    return () => {
      if (heatLayerRef.current && map) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map, data, visible, config.radius, config.blur, config.maxZoom, config.max, config.minOpacity, config.gradient]);

  // Update layer when visibility changes
  useEffect(() => {
    if (!heatLayerRef.current || !map) return;

    if (visible) {
      if (!map.hasLayer(heatLayerRef.current)) {
        heatLayerRef.current.addTo(map);
      }
    } else {
      if (map.hasLayer(heatLayerRef.current)) {
        map.removeLayer(heatLayerRef.current);
      }
    }
  }, [visible, map]);

  // Update heatmap data when it changes
  useEffect(() => {
    if (heatLayerRef.current && visible && data.length > 0) {
      heatLayerRef.current.setLatLngs(data);
    }
  }, [data, visible]);

  // This component doesn't render anything directly
  return null;
};

export default HeatmapLayer;
