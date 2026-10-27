import { Link } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.js';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import BookingStatusBadge from './BookingStatusBadge.jsx';
import BookingActions from './BookingActions.jsx';
import {
  formatBookingReference,
  calculateBookingDurationMinutes,
} from '../utils/bookingFormatters.js';
import { formatDate, formatTimeRange, formatDuration } from '../../../utils/date.js';

/**
 * BookingCard Component
 *
 * Renders an accessible, responsive summary card for an individual booking.
 * Displays resource attributes, date/time interval, status badge, and quick actions.
 *
 * @param {object} props
 * @param {object} props.booking - Populated booking object from GET /api/v1/bookings/my
 * @param {Function} [props.onCancelClick] - Optional cancellation callback
 * @param {Function} [props.onRescheduleClick] - Optional rescheduling callback
 */
export default function BookingCard({ booking, onCancelClick, onRescheduleClick }) {
  if (!booking) return null;

  const resource = booking.resource || {};
  const durationMinutes = calculateBookingDurationMinutes(booking.startAt, booking.endAt);
  const reference = formatBookingReference(booking.id);

  const formattedDate = formatDate(booking.startAt, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTimeRange = formatTimeRange(booking.startAt, booking.endAt);

  return (
    <Card className={`booking-card booking-card--${booking.status || 'default'}`}>
      <div className="booking-card__header">
        <div className="booking-card__title-group">
          <Link
            to={ROUTES.BOOKING_DETAILS(booking.id)}
            className="booking-card__resource-name"
            title={`View details for ${resource.name || 'Resource'}`}
          >
            {resource.name || 'Unnamed Facility'}
          </Link>
          <div className="booking-card__meta-chips">
            <span className="booking-card__reference" title={`Booking ID: ${booking.id}`}>
              {reference}
            </span>
            {resource.category && (
              <Badge variant="neutral" size="sm">
                {resource.category.replace('-', ' ')}
              </Badge>
            )}
          </div>
        </div>

        <div className="booking-card__status-wrapper">
          <BookingStatusBadge status={booking.status} size="sm" />
        </div>
      </div>

      <div className="booking-card__body">
        {/* Date and Time Details */}
        <div className="booking-card__schedule-row">
          <div className="booking-card__schedule-item">
            <span className="booking-card__icon" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" width="14" height="14">
                <rect x="2" y="3" width="12" height="11" rx="2" />
                <line x1="2" y1="7" x2="14" y2="7" />
                <line x1="5" y1="1.5" x2="5" y2="3.5" />
                <line x1="11" y1="1.5" x2="11" y2="3.5" />
              </svg>
            </span>
            <span className="booking-card__schedule-text">
              <strong>{formattedDate}</strong>
            </span>
          </div>

          <div className="booking-card__schedule-item">
            <span className="booking-card__icon" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" width="14" height="14">
                <circle cx="8" cy="8" r="6" />
                <polyline points="8 4 8 8 10 9.5" />
              </svg>
            </span>
            <span className="booking-card__schedule-text">
              {formattedTimeRange} ({formatDuration(durationMinutes)})
            </span>
          </div>
        </div>

        {/* Location & Capacity */}
        {(resource.location || resource.capacity) && (
          <div className="booking-card__resource-row">
            {resource.location && (
              <span className="booking-card__location">
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  width="13"
                  height="13"
                  aria-hidden="true"
                >
                  <path d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 3.5 4.5 8.5 4.5 8.5s4.5-5 4.5-8.5A4.5 4.5 0 0 0 8 1.5z" />
                  <circle cx="8" cy="6" r="1.5" />
                </svg>
                {resource.location}
              </span>
            )}
            {resource.capacity && (
              <span className="booking-card__capacity">
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  width="13"
                  height="13"
                  aria-hidden="true"
                >
                  <path d="M11.5 13.5v-1a2.5 2.5 0 0 0-2.5-2.5h-2a2.5 2.5 0 0 0-2.5 2.5v1" />
                  <circle cx="8" cy="5" r="2.5" />
                </svg>
                Capacity: {resource.capacity}
              </span>
            )}
          </div>
        )}

        {/* Notes preview if entered by user */}
        {booking.notes && (
          <p className="booking-card__notes-snippet" title={booking.notes}>
            <span className="booking-card__notes-label">Notes:</span> {booking.notes}
          </p>
        )}

        {/* Cancellation Notice if cancelled */}
        {booking.status === 'cancelled' && (
          <div className="booking-card__cancellation-banner">
            <span className="booking-card__cancellation-text">
              Cancelled{booking.cancelledAt ? ` on ${formatDate(booking.cancelledAt)}` : ''}
              {booking.cancellationReason ? `: "${booking.cancellationReason}"` : ''}
            </span>
          </div>
        )}
      </div>

      <div className="booking-card__footer">
        <BookingActions
          booking={booking}
          onCancelClick={onCancelClick}
          onRescheduleClick={onRescheduleClick}
          compact={true}
        />
      </div>
    </Card>
  );
}
