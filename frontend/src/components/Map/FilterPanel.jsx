/**
 * FilterPanel Component
 * Sidebar filter controls for the map
 */

import { useState, useCallback } from 'react';
import { 
  CATEGORY_COLORS, 
  CATEGORY_ICONS,
  STATUS_COLORS,
  STATUS_LABELS,
} from '../../utils/mapHelpers';

// Section header component - defined outside to prevent re-creation on each render
const SectionHeader = ({ title, section, count, isExpanded, onToggle }) => (
  <button
    className="filter-section-header"
    onClick={() => onToggle(section)}
    aria-expanded={isExpanded}
  >
    <span className="section-title">{title}</span>
    {count > 0 && <span className="section-count">{count}</span>}
    <span className={`section-arrow ${isExpanded ? 'expanded' : ''}`}>
      ▼
    </span>
  </button>
);

const FilterPanel = ({
  filters,
  layerVisibility,
  availableCategories,
  availableStatuses,
  ucList = [],
  townList = [],
  hasActiveFilters,
  activeFilterCount,
  stats = {},
  onToggleCategory,
  onToggleStatus,
  onSetSeverityRange,
  onSetDateRange,
  onSetUCFilter,
  onSetTownFilter,
  onSetSearchQuery,
  onResetFilters,
  onToggleLayer,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    layers: true,
    categories: true,
    status: false,
    severity: false,
    date: false,
    location: false,
  });

  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  return (
    <div className={`filter-panel ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Panel Header */}
      <div className="filter-panel-header">
        <h3>Filters</h3>
        <div className="header-actions">
          {hasActiveFilters && (
            <button 
              className="reset-filters-btn"
              onClick={onResetFilters}
              title="Reset all filters"
            >
              Reset ({activeFilterCount})
            </button>
          )}
          <button 
            className="collapse-btn"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {isCollapsed ? '◀' : '▶'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="filter-panel-content">
          {/* Stats Summary */}
          <div className="stats-summary">
            <div className="stat-item">
              <span className="stat-value">{stats.total || 0}</span>
              <span className="stat-label">Total Complaints</span>
            </div>
          </div>

          {/* Search */}
          <div className="filter-search">
            <input
              type="text"
              placeholder="Search complaints..."
              value={filters.searchQuery}
              onChange={(e) => onSetSearchQuery(e.target.value)}
              className="search-input"
              aria-label="Search complaints"
            />
          </div>

          {/* Layer Toggles */}
          <div className="filter-section">
            <SectionHeader title="Map Layers" section="layers" isExpanded={expandedSections.layers} onToggle={toggleSection} />
            {expandedSections.layers && (
              <div className="filter-section-content layer-toggles">
                <label className="layer-toggle">
                  <input
                    type="checkbox"
                    checked={layerVisibility.markers}
                    onChange={() => onToggleLayer('markers')}
                  />
                  <span className="toggle-icon">📍</span>
                  <span>Markers</span>
                </label>
                <label className="layer-toggle">
                  <input
                    type="checkbox"
                    checked={layerVisibility.heatmap}
                    onChange={() => onToggleLayer('heatmap')}
                  />
                  <span className="toggle-icon">🔥</span>
                  <span>Heatmap</span>
                </label>
                <label className="layer-toggle">
                  <input
                    type="checkbox"
                    checked={layerVisibility.ucBoundaries}
                    onChange={() => onToggleLayer('ucBoundaries')}
                  />
                  <span className="toggle-icon">🔲</span>
                  <span>UC Boundaries</span>
                </label>
                <label className="layer-toggle">
                  <input
                    type="checkbox"
                    checked={layerVisibility.townBoundaries}
                    onChange={() => onToggleLayer('townBoundaries')}
                  />
                  <span className="toggle-icon">🏙️</span>
                  <span>Town Boundaries</span>
                </label>
                <label className="layer-toggle">
                  <input
                    type="checkbox"
                    checked={layerVisibility.clusters}
                    onChange={() => onToggleLayer('clusters')}
                  />
                  <span className="toggle-icon">⭕</span>
                  <span>Cluster Markers</span>
                </label>
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="filter-section">
            <SectionHeader 
              title="Categories" 
              section="categories" 
              count={filters.categories.length}
              isExpanded={expandedSections.categories}
              onToggle={toggleSection}
            />
            {expandedSections.categories && (
              <div className="filter-section-content category-filters">
                {availableCategories.map(category => (
                  <label 
                    key={category}
                    className={`category-filter ${filters.categories.includes(category) ? 'active' : ''}`}
                    style={{ 
                      '--category-color': CATEGORY_COLORS[category],
                      borderColor: filters.categories.includes(category) 
                        ? CATEGORY_COLORS[category] 
                        : 'transparent'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={() => onToggleCategory(category)}
                    />
                    <span className="category-icon">{CATEGORY_ICONS[category]}</span>
                    <span className="category-name">{category}</span>
                    {stats.byCategory?.[category] && (
                      <span className="category-count">{stats.byCategory[category]}</span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="filter-section">
            <SectionHeader 
              title="Status" 
              section="status" 
              count={filters.status.length}
              isExpanded={expandedSections.status}
              onToggle={toggleSection}
            />
            {expandedSections.status && (
              <div className="filter-section-content status-filters">
                {availableStatuses.map(status => (
                  <label 
                    key={status}
                    className={`status-filter ${filters.status.includes(status) ? 'active' : ''}`}
                    style={{ 
                      '--status-color': STATUS_COLORS[status],
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={() => onToggleStatus(status)}
                    />
                    <span 
                      className="status-dot"
                      style={{ backgroundColor: STATUS_COLORS[status] }}
                    ></span>
                    <span className="status-name">{STATUS_LABELS[status]}</span>
                    {stats.byStatus?.[status] && (
                      <span className="status-count">{stats.byStatus[status]}</span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Severity */}
          <div className="filter-section">
            <SectionHeader title="Severity" section="severity" isExpanded={expandedSections.severity} onToggle={toggleSection} />
            {expandedSections.severity && (
              <div className="filter-section-content severity-filter">
                <div className="severity-range">
                  <label>
                    <span>Min: {filters.severity.min}</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={filters.severity.min}
                      onChange={(e) => onSetSeverityRange(
                        parseInt(e.target.value),
                        filters.severity.max
                      )}
                    />
                  </label>
                  <label>
                    <span>Max: {filters.severity.max}</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={filters.severity.max}
                      onChange={(e) => onSetSeverityRange(
                        filters.severity.min,
                        parseInt(e.target.value)
                      )}
                    />
                  </label>
                </div>
                <div className="severity-labels">
                  <span className="severity-low">Low (1-3)</span>
                  <span className="severity-med">Medium (4-6)</span>
                  <span className="severity-high">High (7-10)</span>
                </div>
              </div>
            )}
          </div>

          {/* Date Range */}
          <div className="filter-section">
            <SectionHeader title="Date Range" section="date" isExpanded={expandedSections.date} onToggle={toggleSection} />
            {expandedSections.date && (
              <div className="filter-section-content date-filter">
                <label>
                  <span>From:</span>
                  <input
                    type="date"
                    value={filters.dateRange.from || ''}
                    onChange={(e) => onSetDateRange(e.target.value, filters.dateRange.to)}
                  />
                </label>
                <label>
                  <span>To:</span>
                  <input
                    type="date"
                    value={filters.dateRange.to || ''}
                    onChange={(e) => onSetDateRange(filters.dateRange.from, e.target.value)}
                  />
                </label>
                {(filters.dateRange.from || filters.dateRange.to) && (
                  <button
                    className="clear-date-btn"
                    onClick={() => onSetDateRange(null, null)}
                  >
                    Clear dates
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Location (UC/Town) */}
          <div className="filter-section">
            <SectionHeader title="Location" section="location" isExpanded={expandedSections.location} onToggle={toggleSection} />
            {expandedSections.location && (
              <div className="filter-section-content location-filter">
                {/* Town dropdown */}
                <label>
                  <span>Town:</span>
                  <select
                    value={filters.town || ''}
                    onChange={(e) => onSetTownFilter(e.target.value || null)}
                  >
                    <option value="">All Towns</option>
                    {townList.map(town => (
                      <option key={town.id || town.name} value={town.name}>
                        {town.name}
                      </option>
                    ))}
                  </select>
                </label>

                {/* UC dropdown */}
                <label>
                  <span>Union Council:</span>
                  <select
                    value={filters.ucId || ''}
                    onChange={(e) => onSetUCFilter(e.target.value || null)}
                  >
                    <option value="">All UCs</option>
                    {ucList
                      .filter(uc => !filters.town || uc.town === filters.town)
                      .map(uc => (
                        <option key={uc.id} value={uc.id}>
                          {uc.name} {uc.town && `(${uc.town})`}
                        </option>
                      ))}
                  </select>
                </label>

                {(filters.town || filters.ucId) && (
                  <button
                    className="clear-location-btn"
                    onClick={() => {
                      onSetTownFilter(null);
                      onSetUCFilter(null);
                    }}
                  >
                    Clear location
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
