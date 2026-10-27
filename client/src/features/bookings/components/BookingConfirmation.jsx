import { Link } from 'react-router-dom';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import { formatBookingStatus, formatBookingReference } from '../utils/bookingFormatters.js';
import { formatCalendarDate, formatSlotInterval } from '../../availability/utils/availabilityUtils.js';
import { formatDate } from '../../../utils/date.js';
import ROUTES from '../../../app/routes.js';

/**
 * Trustworthy Booking Confirmation Receipt Component
 *
 * Renders confirmed booking information strictly derived from authoritative server response.
 *
 * @param {object} props
 * @param {object} props.booking - Confirmed server booking record
 */
export default function BookingConfirmation({ booking }) {
  if (!booking) return null;

  const bookingId = booking.id || booking._id;
  const resource = booking.resource || booking.resourceId;
  const statusMeta = formatBookingStatus(booking.status);
  const reference = formatBookingReference(bookingId);

  // Extract date string from startAt (YYYY-MM-DD)
  const startDateStr = booking.startAt ? String(booking.startAt).slice(0, 10) : '';
  const timeIntervalLabel = formatSlotInterval(booking.startAt, booking.endAt);

  return (
    <div className="booking-confirmation-card" aria-labelledby="booking-confirmed-title">
      <div className="booking-confirmation-card__hero">
        <div className="booking-confirmation-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" stroke="currentColor" />
            <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
          </svg>
        </div>

        <h1 id="booking-confirmed-title" className="booking-confirmation-card__title">
          Reservation Confirmed!
        </h1>
        <p className="booking-confirmation-card__subtitle">
          Your reservation has been recorded and allocated in the system.
        </p>
      </div>

      <div className="booking-confirmation-card__details">
        <div className="booking-confirmation-receipt">
          <div className="booking-confirmation-receipt__header">
            <div>
              <span className="booking-confirmation-receipt__label">Booking Reference:</span>
              <div className="booking-confirmation-receipt__code">
                <code>{reference}</code>
              </div>
            </div>

            <Badge variant={statusMeta.variant} size="md">
              {statusMeta.label}
            </Badge>
          </div>

          <dl className="booking-confirmation-receipt__list">
            <div className="booking-confirmation-receipt__row">
              <dt className="booking-confirmation-receipt__item-label">Resource:</dt>
              <dd className="booking-confirmation-receipt__item-value">
                <strong>{resource?.name || 'Campus Resource'}</strong>
              </dd>
            </div>

            {resource?.location && (
              <div className="booking-confirmation-receipt__row">
                <dt className="booking-confirmation-receipt__item-label">Location:</dt>
                <dd className="booking-confirmation-receipt__item-value">
                  {resource.location}
                </dd>
              </div>
            )}

            <div className="booking-confirmation-receipt__row">
              <dt className="booking-confirmation-receipt__item-label">Date:</dt>
              <dd className="booking-confirmation-receipt__item-value">
                <strong>{formatCalendarDate(startDateStr)}</strong>
              </dd>
            </div>

            <div className="booking-confirmation-receipt__row">
              <dt className="booking-confirmation-receipt__item-label">Allocated Interval:</dt>
              <dd className="booking-confirmation-receipt__item-value">
                <strong>{timeIntervalLabel}</strong>
              </dd>
            </div>

            {booking.notes && (
              <div className="booking-confirmation-receipt__row">
                <dt className="booking-confirmation-receipt__item-label">Notes:</dt>
                <dd className="booking-confirmation-receipt__item-value">
                  {booking.notes}
                </dd>
              </div>
            )}

            <div className="booking-confirmation-receipt__row booking-confirmation-receipt__row--timestamp">
              <dt className="booking-confirmation-receipt__item-label">Reserved On:</dt>
              <dd className="booking-confirmation-receipt__item-value">
                {formatDate(booking.createdAt, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="booking-confirmation-card__actions">
        <Button
          as={Link}
          to={ROUTES.BOOKINGS}
          variant="primary"
          size="md"
        >
          View in My Bookings
        </Button>

        <Button
          as={Link}
          to={ROUTES.RESOURCES}
          variant="outline"
          size="md"
        >
          Explore More Resources
        </Button>
      </div>
    </div>
  );
}
