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
 * BookingDetailsPanel Component
 *
 * Comprehensive view of an individual reservation record returned by GET /api/v1/bookings/:bookingId.
 *
 * @param {object} props
 * @param {object} props.booking - Authoritative booking object from backend
 * @param {Function} [props.onCancelClick] - Optional cancellation callback
 * @param {Function} [props.onRescheduleClick] - Optional rescheduling callback
 */
export default function BookingDetailsPanel({
  booking,
  onCancelClick,
  onRescheduleClick,
}) {
  if (!booking) return null;

  const resource = booking.resource || {};
  const resourceId = booking.resourceId?._id || booking.resourceId?.id || booking.resourceId;
  const durationMinutes = calculateBookingDurationMinutes(booking.startAt, booking.endAt);
  const reference = formatBookingReference(booking.id);

  const formattedDate = formatDate(booking.startAt, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTimeRange = formatTimeRange(booking.startAt, booking.endAt);

  return (
    <div className="booking-details-panel">
      {/* Primary Overview Card */}
      <Card className="booking-details-panel__card">
        {/* Header with Title and Status */}
        <div className="booking-details-panel__header">
          <div className="booking-details-panel__title-group">
            <span className="booking-details-panel__ref-badge">
              Reference {reference}
            </span>
            <h2 className="booking-details-panel__resource-title">
              {resource.name ? (
                <Link
                  to={ROUTES.RESOURCE_DETAILS(resourceId)}
                  className="booking-details-panel__resource-link"
                >
                  {resource.name}
                </Link>
              ) : (
                'Reserved Resource'
              )}
            </h2>
          </div>

          <div className="booking-details-panel__status-badge-wrapper">
            <BookingStatusBadge status={booking.status} size="lg" />
          </div>
        </div>

        {/* Schedule & Timing Grid */}
        <section className="booking-details-panel__section" aria-labelledby="schedule-heading">
          <h3 id="schedule-heading" className="booking-details-panel__section-title">
            Reservation Schedule
          </h3>

          <div className="booking-details-panel__info-grid">
            <div className="booking-details-panel__info-item">
              <span className="booking-details-panel__label">Date</span>
              <span className="booking-details-panel__value booking-details-panel__value--highlight">
                {formattedDate}
              </span>
            </div>

            <div className="booking-details-panel__info-item">
              <span className="booking-details-panel__label">Time Interval</span>
              <span className="booking-details-panel__value booking-details-panel__value--highlight">
                {formattedTimeRange}
              </span>
            </div>

            <div className="booking-details-panel__info-item">
              <span className="booking-details-panel__label">Duration</span>
              <span className="booking-details-panel__value">
                {formatDuration(durationMinutes)} ({durationMinutes} minutes)
              </span>
            </div>

            <div className="booking-details-panel__info-item">
              <span className="booking-details-panel__label">Booking ID</span>
              <span className="booking-details-panel__value booking-details-panel__value--mono">
                {booking.id}
              </span>
            </div>
          </div>
        </section>

        {/* Resource Details Grid */}
        <section className="booking-details-panel__section" aria-labelledby="resource-heading">
          <h3 id="resource-heading" className="booking-details-panel__section-title">
            Resource Information
          </h3>

          <div className="booking-details-panel__info-grid">
            <div className="booking-details-panel__info-item">
              <span className="booking-details-panel__label">Category</span>
              <span className="booking-details-panel__value">
                {resource.category ? (
                  <Badge variant="neutral" size="sm">
                    {resource.category.replace('-', ' ')}
                  </Badge>
                ) : (
                  'Standard'
                )}
              </span>
            </div>

            <div className="booking-details-panel__info-item">
              <span className="booking-details-panel__label">Location</span>
              <span className="booking-details-panel__value">
                {resource.location || 'Campus Facility'}
              </span>
            </div>

            <div className="booking-details-panel__info-item">
              <span className="booking-details-panel__label">Max Capacity</span>
              <span className="booking-details-panel__value">
                {resource.capacity ? `${resource.capacity} people` : 'Standard capacity'}
              </span>
            </div>

            <div className="booking-details-panel__info-item">
              <span className="booking-details-panel__label">Slot Grid</span>
              <span className="booking-details-panel__value">
                {resource.slotDurationMinutes
                  ? `${resource.slotDurationMinutes}-minute increments`
                  : 'Fixed intervals'}
              </span>
            </div>
          </div>

          {resource.description && (
            <div className="booking-details-panel__description-block">
              <span className="booking-details-panel__label">Description</span>
              <p className="booking-details-panel__description-text">{resource.description}</p>
            </div>
          )}
        </section>

        {/* User Reservation Notes */}
        <section className="booking-details-panel__section" aria-labelledby="notes-heading">
          <h3 id="notes-heading" className="booking-details-panel__section-title">
            Reservation Notes
          </h3>
          {booking.notes ? (
            <p className="booking-details-panel__notes-box">{booking.notes}</p>
          ) : (
            <p className="booking-details-panel__empty-notes">No notes provided for this reservation.</p>
          )}
        </section>

        {/* Cancellation Details if Cancelled */}
        {booking.status === 'cancelled' && (
          <section className="booking-details-panel__section booking-details-panel__section--cancelled">
            <h3 className="booking-details-panel__section-title booking-details-panel__section-title--danger">
              Cancellation Record
            </h3>
            <div className="booking-details-panel__info-grid">
              <div className="booking-details-panel__info-item">
                <span className="booking-details-panel__label">Cancelled At</span>
                <span className="booking-details-panel__value">
                  {booking.cancelledAt
                    ? formatDate(booking.cancelledAt, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recorded'}
                </span>
              </div>

              <div className="booking-details-panel__info-item">
                <span className="booking-details-panel__label">Reason</span>
                <span className="booking-details-panel__value">
                  {booking.cancellationReason || 'No reason provided'}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Audit Timestamps */}
        <section className="booking-details-panel__audit-footer">
          <span className="booking-details-panel__audit-item">
            Created: {formatDate(booking.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          {booking.updatedAt && (
            <span className="booking-details-panel__audit-item">
              Last Updated: {formatDate(booking.updatedAt, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </section>

        {/* Actions Bar */}
        <div className="booking-details-panel__actions">
          <BookingActions
            booking={booking}
            onCancelClick={onCancelClick}
            onRescheduleClick={onRescheduleClick}
          />
        </div>
      </Card>
    </div>
  );
}
