/**
 * TerritoryBoundaries Component
 * Renders UC and Town boundary polygons from GeoJSON
 */

import { useState, useCallback } from 'react';
import { GeoJSON, Tooltip, useMap } from 'react-leaflet';
import { getUCStyle, getTownStyle } from '../../utils/mapHelpers';

/**
 * UC Boundaries Layer
 */
export const UCBoundaries = ({
  data,
  visible = true,
  selectedUCId = null,
  onUCClick,
  onUCHover,
}) => {
  const map = useMap();
  const [hoveredUC, setHoveredUC] = useState(null);

  // Style function for each feature
  const styleFunction = useCallback((feature) => {
    const isHovered = hoveredUC === feature.properties.uc_id;
    const isSelected = selectedUCId === feature.properties.uc_id;
    return getUCStyle(feature, isHovered, isSelected);
  }, [hoveredUC, selectedUCId]);

  // Event handlers for each feature
  const onEachFeature = useCallback((feature, layer) => {
    // Mouse events
    layer.on({
      mouseover: (e) => {
        setHoveredUC(feature.properties.uc_id);
        if (onUCHover) onUCHover(feature.properties);
        
        // Highlight style
        e.target.setStyle(getUCStyle(feature, true, selectedUCId === feature.properties.uc_id));
        e.target.bringToFront();
      },
      mouseout: (e) => {
        setHoveredUC(null);
        if (onUCHover) onUCHover(null);
        
        // Reset style
        e.target.setStyle(getUCStyle(feature, false, selectedUCId === feature.properties.uc_id));
      },
      click: () => {
        if (onUCClick) {
          onUCClick(feature.properties);
          
          // Zoom to UC bounds
          const bounds = layer.getBounds();
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      },
    });
  }, [map, onUCClick, onUCHover, selectedUCId]);

  if (!visible || !data || !data.features?.length) {
    return null;
  }

  return (
    <GeoJSON
      key={`uc-${selectedUCId}-${hoveredUC}`}
      data={data}
      style={styleFunction}
      onEachFeature={onEachFeature}
    >
      {/* Tooltips are handled via onEachFeature for better control */}
    </GeoJSON>
  );
};

/**
 * Town Boundaries Layer
 */
export const TownBoundaries = ({
  data,
  visible = true,
  selectedTown = null,
  onTownClick,
  onTownHover,
}) => {
  const map = useMap();
  const [hoveredTown, setHoveredTown] = useState(null);

  // Style function for each feature
  const styleFunction = useCallback((feature) => {
    const townName = feature.properties.town_name || feature.properties.town;
    const isHovered = hoveredTown === townName;
    const isSelected = selectedTown === townName;
    return getTownStyle(feature, isHovered, isSelected);
  }, [hoveredTown, selectedTown]);

  // Event handlers for each feature
  const onEachFeature = useCallback((feature, layer) => {
    const townName = feature.properties.town_name || feature.properties.town;
    
    // Add tooltip
    layer.bindTooltip(townName, {
      permanent: false,
      direction: 'center',
      className: 'town-tooltip',
    });

    // Mouse events
    layer.on({
      mouseover: (e) => {
        setHoveredTown(townName);
        if (onTownHover) onTownHover(feature.properties);
        
        // Highlight style
        e.target.setStyle(getTownStyle(feature, true, selectedTown === townName));
        e.target.bringToFront();
      },
      mouseout: (e) => {
        setHoveredTown(null);
        if (onTownHover) onTownHover(null);
        
        // Reset style
        e.target.setStyle(getTownStyle(feature, false, selectedTown === townName));
      },
      click: () => {
        if (onTownClick) {
          onTownClick(feature.properties);
          
          // Zoom to Town bounds
          const bounds = layer.getBounds();
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      },
    });
  }, [map, onTownClick, onTownHover, selectedTown]);

  if (!visible || !data || !data.features?.length) {
    return null;
  }

  return (
    <GeoJSON
      key={`town-${selectedTown}-${hoveredTown}`}
      data={data}
      style={styleFunction}
      onEachFeature={onEachFeature}
    />
  );
};

/**
 * Combined Territory Boundaries Component
 */
const TerritoryBoundaries = ({
  ucData,
  townData,
  showUC = true,
  showTown = true,
  selectedUCId = null,
  selectedTown = null,
  onUCClick,
  onTownClick,
  onUCHover,
  onTownHover,
}) => {
  return (
    <>
      {/* Town boundaries render below UC boundaries */}
      <TownBoundaries
        data={townData}
        visible={showTown}
        selectedTown={selectedTown}
        onTownClick={onTownClick}
        onTownHover={onTownHover}
      />
      
      {/* UC boundaries render on top */}
      <UCBoundaries
        data={ucData}
        visible={showUC}
        selectedUCId={selectedUCId}
        onUCClick={onUCClick}
        onUCHover={onUCHover}
      />
    </>
  );
};

export default TerritoryBoundaries;
