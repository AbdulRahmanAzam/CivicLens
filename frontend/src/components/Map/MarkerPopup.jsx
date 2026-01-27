/**
 * MarkerPopup Component
 * Displays complaint details in a map popup
 */

import { 
  CATEGORY_COLORS, 
  CATEGORY_ICONS,
  STATUS_COLORS, 
  STATUS_LABELS,
  getSeverityColor,
  formatDate,
  formatRelativeTime,
  truncateText,
} from '../../utils/mapHelpers';

const MarkerPopup = ({ complaint, onViewDetails }) => {
  const category = complaint.category?.primary || complaint.category || 'Other';
  const status = complaint.status || 'reported';
  const severity = complaint.severity || 5;
  const categoryColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.reported;
  const severityColor = getSeverityColor(severity);

  return (
    <div className="complaint-popup">
      {/* Header with category */}
      <div className="popup-header" style={{ borderLeftColor: categoryColor }}>
        <span className="category-icon">{CATEGORY_ICONS[category] || '📋'}</span>
        <span className="category-name" style={{ color: categoryColor }}>
          {category}
        </span>
      </div>

      {/* Complaint text */}
      <div className="popup-content">
        <p className="complaint-text">
          {truncateText(complaint.text || complaint.description, 150)}
        </p>
      </div>

      {/* Badges row */}
      <div className="popup-badges">
        {/* Status badge */}
        <span 
          className="badge status-badge"
          style={{ backgroundColor: statusColor }}
        >
          {STATUS_LABELS[status] || status}
        </span>

        {/* Severity badge */}
        <span 
          className="badge severity-badge"
          style={{ backgroundColor: severityColor }}
        >
          Severity: {severity}/10
        </span>
      </div>

      {/* Location info */}
      {complaint.address && (
        <div className="popup-location">
          <span className="location-icon">📍</span>
          <span className="location-text">
            {truncateText(complaint.address, 60)}
          </span>
        </div>
      )}

      {/* UC/Town info */}
      {(complaint.uc_name || complaint.town) && (
        <div className="popup-territory">
          {complaint.uc_name && (
            <span className="territory-tag uc-tag">{complaint.uc_name}</span>
          )}
          {complaint.town && (
            <span className="territory-tag town-tag">{complaint.town}</span>
          )}
        </div>
      )}

      {/* Footer with date and action */}
      <div className="popup-footer">
        <span className="complaint-date" title={formatDate(complaint.created_at || complaint.createdAt)}>
          {formatRelativeTime(complaint.created_at || complaint.createdAt)}
        </span>
        
        {onViewDetails && (
          <button 
            className="view-details-btn"
            onClick={() => onViewDetails(complaint)}
          >
            View Details →
          </button>
        )}
      </div>

      {/* Complaint ID */}
      {complaint.complaintId && (
        <div className="popup-id">
          ID: {complaint.complaintId}
        </div>
      )}
    </div>
  );
};

export default MarkerPopup;
