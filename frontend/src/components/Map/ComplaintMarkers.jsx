/**
 * ComplaintMarkers Component
 * Renders complaint markers with clustering support
 */

import { useMemo, useCallback } from 'react';
import { Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import MarkerPopup from './MarkerPopup';
import { 
  createCategoryIcon, 
  createClusterIcon,
  getComplaintLatLng,
  CATEGORY_COLORS,
} from '../../utils/mapHelpers';

const ComplaintMarkers = ({
  complaints = [],
  visible = true,
  clustered = true,
  onMarkerClick,
  onViewDetails,
  selectedComplaintId = null,
}) => {
  // Filter complaints with valid locations
  const validComplaints = useMemo(() => {
    return complaints.filter(c => {
      const latLng = getComplaintLatLng(c);
      return latLng && !isNaN(latLng[0]) && !isNaN(latLng[1]);
    });
  }, [complaints]);

  // Handle marker click
  const handleMarkerClick = useCallback((complaint) => {
    if (onMarkerClick) {
      onMarkerClick(complaint);
    }
  }, [onMarkerClick]);

  // Create cluster icon function
  const clusterIconFn = useCallback((cluster) => {
    return createClusterIcon(cluster);
  }, []);

  // Don't render if not visible
  if (!visible || validComplaints.length === 0) {
    return null;
  }

  // Render individual markers
  const markers = validComplaints.map((complaint) => {
    const latLng = getComplaintLatLng(complaint);
    const category = complaint.category?.primary || complaint.category || 'Other';
    const isSelected = complaint._id === selectedComplaintId || 
                       complaint.complaintId === selectedComplaintId;
    
    const icon = createCategoryIcon(category, isSelected ? 'large' : 'medium');

    return (
      <Marker
        key={complaint._id || complaint.complaintId}
        position={latLng}
        icon={icon}
        eventHandlers={{
          click: () => handleMarkerClick(complaint),
        }}
      >
        <Popup 
          className="complaint-marker-popup"
          maxWidth={320}
          minWidth={280}
        >
          <MarkerPopup 
            complaint={complaint}
            onViewDetails={onViewDetails}
          />
        </Popup>
      </Marker>
    );
  });

  // Render with or without clustering
  if (clustered && validComplaints.length > 10) {
    return (
      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={clusterIconFn}
        maxClusterRadius={60}
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
        zoomToBoundsOnClick={true}
        disableClusteringAtZoom={16}
      >
        {markers}
      </MarkerClusterGroup>
    );
  }

  // Render without clustering
  return <>{markers}</>;
};

export default ComplaintMarkers;
