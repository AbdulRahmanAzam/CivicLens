/**
 * MapControls Component
 * Layer toggles, zoom controls, and fullscreen
 */

import { useState, useCallback } from 'react';
import { useMap } from 'react-leaflet';

const MapControls = ({
  layerVisibility,
  onToggleLayer,
  onZoomIn,
  onZoomOut,
  onResetView,
}) => {
  const map = useMap();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle zoom in
  const handleZoomIn = useCallback(() => {
    if (onZoomIn) {
      onZoomIn();
    } else {
      map.zoomIn();
    }
  }, [map, onZoomIn]);

  // Handle zoom out
  const handleZoomOut = useCallback(() => {
    if (onZoomOut) {
      onZoomOut();
    } else {
      map.zoomOut();
    }
  }, [map, onZoomOut]);

  // Handle reset view
  const handleResetView = useCallback(() => {
    if (onResetView) {
      onResetView();
    } else {
      map.setView([24.8607, 67.0011], 12);
    }
  }, [map, onResetView]);

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const container = map.getContainer().parentElement;
    
    if (!document.fullscreenElement) {
      container.requestFullscreen?.() || 
      container.webkitRequestFullscreen?.() ||
      container.msRequestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.() ||
      document.webkitExitFullscreen?.() ||
      document.msExitFullscreen?.();
      setIsFullscreen(false);
    }
  }, [map]);

  // Locate user
  const handleLocate = useCallback(() => {
    map.locate({ setView: true, maxZoom: 16 });
  }, [map]);

  return (
    <div className="map-controls">
      {/* Zoom Controls */}
      <div className="control-group zoom-controls">
        <button
          className="control-btn"
          onClick={handleZoomIn}
          title="Zoom in"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          className="control-btn"
          onClick={handleZoomOut}
          title="Zoom out"
          aria-label="Zoom out"
        >
          −
        </button>
      </div>

      {/* Navigation Controls */}
      <div className="control-group nav-controls">
        <button
          className="control-btn"
          onClick={handleResetView}
          title="Reset view to Karachi"
          aria-label="Reset view"
        >
          🏠
        </button>
        <button
          className="control-btn"
          onClick={handleLocate}
          title="Find my location"
          aria-label="Find my location"
        >
          📍
        </button>
        <button
          className="control-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? '⛶' : '⛶'}
        </button>
      </div>

      {/* Layer Quick Toggles */}
      <div className="control-group layer-controls">
        <button
          className={`control-btn ${layerVisibility.markers ? 'active' : ''}`}
          onClick={() => onToggleLayer('markers')}
          title="Toggle markers"
          aria-label="Toggle markers"
          aria-pressed={layerVisibility.markers}
        >
          📌
        </button>
        <button
          className={`control-btn ${layerVisibility.heatmap ? 'active' : ''}`}
          onClick={() => onToggleLayer('heatmap')}
          title="Toggle heatmap"
          aria-label="Toggle heatmap"
          aria-pressed={layerVisibility.heatmap}
        >
          🔥
        </button>
        <button
          className={`control-btn ${layerVisibility.ucBoundaries ? 'active' : ''}`}
          onClick={() => onToggleLayer('ucBoundaries')}
          title="Toggle UC boundaries"
          aria-label="Toggle UC boundaries"
          aria-pressed={layerVisibility.ucBoundaries}
        >
          🗺️
        </button>
      </div>
    </div>
  );
};

export default MapControls;
