import { Link } from 'react-router-dom';
import Badge from '../../../components/ui/Badge.jsx';
import { formatCalendarDate, formatSlotInterval } from '../../availability/utils/availabilityUtils.js';
import { formatDuration } from '../../../utils/date.js';
import ROUTES from '../../../app/routes.js';

function getCategoryBadge(category) {
  switch (category) {
    case 'study-room':
      return <Badge variant="info" size="sm">Study Room</Badge>;
    case 'meeting-room':
      return <Badge variant="primary" size="sm">Meeting Room</Badge>;
    case 'lab-equipment':
      return <Badge variant="warning" size="sm">Lab Equipment</Badge>;
    case 'other':
    default:
      return <Badge variant="neutral" size="sm">Resource Space</Badge>;
  }
}

/**
 * Booking Summary Component
 *
 * Displays selected resource specifications and time interval before final submission.
 *
 * @param {object} props
 * @param {object} props.resource - Resource entity or summary
 * @param {string} props.date - YYYY-MM-DD
 * @param {string} props.startAt - ISO 8601 instant
 * @param {string} props.endAt - ISO 8601 instant
 * @param {string} [props.timeZone='UTC']
 */
export default function BookingSummary({
  resource,
  date,
  startAt,
  endAt,
  timeZone = 'UTC',
}) {
  const resourceId = resource?._id || resource?.id;
  const timeIntervalLabel = formatSlotInterval(startAt, endAt, timeZone);
  const durationLabel = formatDuration(resource?.slotDurationMinutes || 30);

  return (
    <div className="booking-summary-card" aria-label="Reservation Summary">
      <div className="booking-summary-card__header">
        <div className="booking-summary-card__badges">
          {getCategoryBadge(resource?.category)}
          <Badge variant="success" size="sm">Available Slot</Badge>
        </div>
        <h3 className="booking-summary-card__title">{resource?.name}</h3>
        <p className="booking-summary-card__location">
          <span aria-hidden="true">📍</span> {resource?.location || 'Campus Facility'}
        </p>
      </div>

      <div className="booking-summary-card__body">
        <dl className="booking-summary-card__details">
          <div className="booking-summary-card__row">
            <dt className="booking-summary-card__label">Date:</dt>
            <dd className="booking-summary-card__value">
              <strong>{formatCalendarDate(date)}</strong>
            </dd>
          </div>

          <div className="booking-summary-card__row">
            <dt className="booking-summary-card__label">Time Interval:</dt>
            <dd className="booking-summary-card__value">
              <strong>{timeIntervalLabel}</strong> ({durationLabel})
            </dd>
          </div>

          <div className="booking-summary-card__row">
            <dt className="booking-summary-card__label">Seating Capacity:</dt>
            <dd className="booking-summary-card__value">
              Up to {resource?.capacity} attendees
            </dd>
          </div>

          <div className="booking-summary-card__row">
            <dt className="booking-summary-card__label">Schedule Timezone:</dt>
            <dd className="booking-summary-card__value">{timeZone}</dd>
          </div>
        </dl>
      </div>

      <div className="booking-summary-card__footer">
        {resourceId && (
          <Link
            to={ROUTES.RESOURCE_DETAILS(resourceId)}
            className="booking-summary-card__change-link"
          >
            ← Change Slot or Select Another Date
          </Link>
        )}
      </div>
    </div>
  );
}
