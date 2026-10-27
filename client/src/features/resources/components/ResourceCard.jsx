import { Link } from 'react-router-dom';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import { formatDuration } from '../../../utils/date.js';
import ROUTES from '../../../app/routes.js';

/**
 * Maps backend resource category string to display metadata.
 */
function getCategoryMeta(category) {
  switch (category) {
    case 'study-room':
      return { label: 'Study Room', variant: 'info' };
    case 'meeting-room':
      return { label: 'Meeting Room', variant: 'primary' };
    case 'lab-equipment':
      return { label: 'Lab Equipment', variant: 'warning' };
    case 'other':
    default:
      return { label: 'Resource Space', variant: 'neutral' };
  }
}

/**
 * Interactive Resource Card Component
 *
 * Displays a summarized overview of an active bookable resource
 * and provides navigation to its detailed availability page.
 *
 * @param {object} props
 * @param {object} props.resource
 */
export default function ResourceCard({ resource }) {
  const { _id, name, description, category, location, capacity, slotDurationMinutes, status } =
    resource || {};

  const categoryMeta = getCategoryMeta(category);
  const detailUrl = ROUTES.RESOURCE_DETAILS(_id);

  return (
    <article className="resource-card" aria-labelledby={`resource-title-${_id}`}>
      <div className="resource-card__header">
        <div className="resource-card__badges">
          <Badge variant={categoryMeta.variant} size="sm">
            {categoryMeta.label}
          </Badge>
          {status === 'active' && (
            <Badge variant="success" size="sm">
              Active
            </Badge>
          )}
        </div>

        <h3 id={`resource-title-${_id}`} className="resource-card__title">
          <Link to={detailUrl} className="resource-card__title-link">
            {name}
          </Link>
        </h3>
      </div>

      <div className="resource-card__body">
        {description && (
          <p className="resource-card__description">
            {description}
          </p>
        )}

        <div className="resource-card__meta-grid">
          {/* Location */}
          <div className="resource-card__meta-item" title="Location">
            <span className="resource-card__meta-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </span>
            <span className="resource-card__meta-text">{location || 'Campus Facility'}</span>
          </div>

          {/* Capacity */}
          <div className="resource-card__meta-item" title="Capacity">
            <span className="resource-card__meta-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            </span>
            <span className="resource-card__meta-text">
              Capacity: <strong>{capacity}</strong>
            </span>
          </div>

          {/* Slot Duration */}
          <div className="resource-card__meta-item" title="Slot Duration">
            <span className="resource-card__meta-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
              </svg>
            </span>
            <span className="resource-card__meta-text">
              {formatDuration(slotDurationMinutes)} slots
            </span>
          </div>
        </div>
      </div>

      <div className="resource-card__footer">
        <Button
          as={Link}
          to={detailUrl}
          variant="primary"
          size="sm"
          className="resource-card__cta-btn"
        >
          Check Availability & Book
        </Button>
      </div>
    </article>
  );
}
