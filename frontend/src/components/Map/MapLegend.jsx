/**
 * MapLegend Component
 * Displays legend for markers, heatmap, and boundaries
 */

import { useState } from 'react';
import { 
  CATEGORY_COLORS, 
  CATEGORY_ICONS,
  STATUS_COLORS,
  STATUS_LABELS,
  HEATMAP_CONFIG,
} from '../../utils/mapHelpers';

const MapLegend = ({
  visible = true,
  showCategories = true,
  showStatus = true,
  showHeatmap = false,
  showBoundaries = false,
  complaintsInView = 0,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!visible) return null;

  return (
    <div className={`map-legend ${isCollapsed ? 'collapsed' : ''}`}>
      <div 
        className="legend-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span className="legend-title">Legend</span>
        <span className="legend-toggle">{isCollapsed ? '▲' : '▼'}</span>
      </div>

      {!isCollapsed && (
        <div className="legend-content">
          {/* Complaints in view */}
          <div className="legend-stats">
            <span className="stats-value">{complaintsInView}</span>
            <span className="stats-label">complaints in view</span>
          </div>

          {/* Category Legend */}
          {showCategories && (
            <div className="legend-section">
              <h4 className="legend-section-title">Categories</h4>
              <div className="legend-items">
                {Object.entries(CATEGORY_COLORS)
                  .filter(([key]) => key !== 'default')
                  .map(([category, color]) => (
                    <div key={category} className="legend-item">
                      <span 
                        className="legend-marker"
                        style={{ backgroundColor: color }}
                      >
                        {CATEGORY_ICONS[category]}
                      </span>
                      <span className="legend-label">{category}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Status Legend */}
          {showStatus && (
            <div className="legend-section">
              <h4 className="legend-section-title">Status</h4>
              <div className="legend-items">
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                  <div key={status} className="legend-item">
                    <span 
                      className="legend-dot"
                      style={{ backgroundColor: color }}
                    ></span>
                    <span className="legend-label">
                      {STATUS_LABELS[status] || status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Heatmap Legend */}
          {showHeatmap && (
            <div className="legend-section">
              <h4 className="legend-section-title">Complaint Density</h4>
              <div className="heatmap-gradient">
                <div 
                  className="gradient-bar"
                  style={{
                    background: `linear-gradient(to right, 
                      ${HEATMAP_CONFIG.gradient['0.2']},
                      ${HEATMAP_CONFIG.gradient['0.4']},
                      ${HEATMAP_CONFIG.gradient['0.6']},
                      ${HEATMAP_CONFIG.gradient['0.8']},
                      ${HEATMAP_CONFIG.gradient['1.0']}
                    )`,
                  }}
                ></div>
                <div className="gradient-labels">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            </div>
          )}

          {/* Boundary Legend */}
          {showBoundaries && (
            <div className="legend-section">
              <h4 className="legend-section-title">Boundaries</h4>
              <div className="legend-items">
                <div className="legend-item">
                  <span className="legend-line uc-line"></span>
                  <span className="legend-label">Union Council (UC)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-line town-line"></span>
                  <span className="legend-label">Town</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapLegend;
