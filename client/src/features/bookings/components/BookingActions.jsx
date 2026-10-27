import { Link } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.js';
import Button from '../../../components/ui/Button.jsx';
import Alert from '../../../components/ui/Alert.jsx';
import {
  canCancelBooking,
  canRescheduleBooking,
  getActionIneligibilityReason,
} from '../utils/bookingFormatters.js';

/**
 * BookingActions Component
 *
 * Renders contextual management actions for a booking based on backend eligibility policies:
 * - Confirmed future bookings: Offers Reschedule and Cancel triggers (prepared for Prompt 18 workflows).
 * - Concluded or in-progress bookings: Communicates why modifications are prohibited.
 * - Cancelled bookings: Displays historical cancellation information.
 *
 * @param {object} props
 * @param {object} props.booking - Booking record
 * @param {Function} [props.onCancelClick] - Optional callback when user requests cancellation
 * @param {Function} [props.onRescheduleClick] - Optional callback when user requests rescheduling
 * @param {boolean} [props.compact=false] - Whether to render in compact card mode
 */
export default function BookingActions({
  booking,
  onCancelClick,
  onRescheduleClick,
  compact = false,
}) {
  if (!booking) return null;

  const isCancellable = canCancelBooking(booking);
  const isReschedulable = canRescheduleBooking(booking);
  const ineligibilityReason = getActionIneligibilityReason(booking);

  const resourceId = booking.resourceId?._id || booking.resourceId?.id || booking.resourceId;

  // Handler for Prompt 18 workflow transition
  const handleCancel = () => {
    if (onCancelClick) {
      onCancelClick(booking);
    } else {
      // In Prompt 17, notify user that cancellation workflow is hooked up in Prompt 18
      alert(
        `Cancellation Workflow (Prompt 18):\n\nReservation ${booking.id} is eligible for cancellation. Full interactive cancellation modal with atomic slot release will be completed in Prompt 18.`
      );
    }
  };

  const handleReschedule = () => {
    if (onRescheduleClick) {
      onRescheduleClick(booking);
    } else {
      // In Prompt 17, notify user that rescheduling workflow is hooked up in Prompt 18
      alert(
        `Rescheduling Workflow (Prompt 18):\n\nReservation ${booking.id} is eligible for rescheduling. Full interactive interval selection and atomic reallocation will be completed in Prompt 18.`
      );
    }
  };

  if (compact) {
    return (
      <div className="booking-actions booking-actions--compact">
        <Link to={ROUTES.BOOKING_DETAILS(booking.id)} className="booking-actions__details-link">
          <Button variant="secondary" size="sm">
            View Details
          </Button>
        </Link>

        {isCancellable && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            aria-label={`Cancel reservation for ${booking.resource?.name || 'resource'}`}
          >
            Cancel
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="booking-actions booking-actions--detailed">
      {ineligibilityReason && (
        <Alert
          variant={booking.status === 'cancelled' ? 'danger' : 'info'}
          className="booking-actions__policy-alert"
        >
          {ineligibilityReason}
        </Alert>
      )}

      <div className="booking-actions__button-group">
        {isReschedulable && (
          <Button
            variant="secondary"
            onClick={handleReschedule}
            aria-label={`Reschedule reservation ${booking.id}`}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="14"
              height="14"
              aria-hidden="true"
            >
              <path d="M1 8a7 7 0 1 0 2.5-5.3L1 5" />
              <path d="M1 1v4h4" />
            </svg>
            Reschedule Booking
          </Button>
        )}

        {isCancellable && (
          <Button
            variant="outline"
            onClick={handleCancel}
            className="booking-actions__cancel-btn"
            aria-label={`Cancel reservation ${booking.id}`}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="14"
              height="14"
              aria-hidden="true"
            >
              <line x1="3" y1="3" x2="13" y2="13" />
              <line x1="13" y1="3" x2="3" y2="13" />
            </svg>
            Cancel Reservation
          </Button>
        )}

        {resourceId && (
          <Link to={ROUTES.RESOURCE_DETAILS(resourceId)}>
            <Button variant="ghost">View Resource Schedule</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
