/**
 * Map Components Index
 * Export all map-related components
 */

export { default as CivicLensMap } from './CivicLensMap';
export { default as HeatmapLayer } from './HeatmapLayer';
export { default as ComplaintMarkers } from './ComplaintMarkers';
export { default as TerritoryBoundaries, UCBoundaries, TownBoundaries } from './TerritoryBoundaries';
export { default as FilterPanel } from './FilterPanel';
export { default as MapControls } from './MapControls';
export { default as MapLegend } from './MapLegend';
export { default as MarkerPopup } from './MarkerPopup';

// Re-export hooks
export * from './hooks';
