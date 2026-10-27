import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.js';
import Button from '../../../components/ui/Button.jsx';
import Alert from '../../../components/ui/Alert.jsx';
import CancelBookingDialog from './CancelBookingDialog.jsx';
import RescheduleBookingDialog from './RescheduleBookingDialog.jsx';
import {
  canCancelBooking,
  canRescheduleBooking,
  getActionIneligibilityReason,
} from '../utils/bookingPolicyUtils.js';

/**
 * BookingActions Component
 *
 * Renders contextual management actions for a booking based on backend eligibility policies:
 * - Confirmed future bookings: Offers Reschedule and Cancel dialog triggers.
 * - Concluded or in-progress bookings: Communicates why modifications are prohibited.
 * - Cancelled bookings: Displays historical cancellation information.
 *
 * @param {object} props
 * @param {object} props.booking - Booking record
 * @param {Function} [props.onCancelClick] - Optional callback when user requests cancellation
 * @param {Function} [props.onRescheduleClick] - Optional callback when user requests rescheduling
 * @param {Function} [props.onActionSuccess] - Optional callback invoked when cancellation or rescheduling succeeds
 * @param {boolean} [props.compact=false] - Whether to render in compact card mode
 */
export default function BookingActions({
  booking,
  onCancelClick,
  onRescheduleClick,
  onActionSuccess,
  compact = false,
}) {
  const [isInternalCancelOpen, setIsInternalCancelOpen] = useState(false);
  const [isInternalRescheduleOpen, setIsInternalRescheduleOpen] = useState(false);

  if (!booking) return null;

  const isCancellable = canCancelBooking(booking);
  const isReschedulable = canRescheduleBooking(booking);
  const ineligibilityReason = getActionIneligibilityReason(booking);

  const resourceId = booking.resourceId?._id || booking.resourceId?.id || booking.resourceId;

  const handleCancel = () => {
    if (onCancelClick) {
      onCancelClick(booking);
    } else {
      setIsInternalCancelOpen(true);
    }
  };

  const handleReschedule = () => {
    if (onRescheduleClick) {
      onRescheduleClick(booking);
    } else {
      setIsInternalRescheduleOpen(true);
    }
  };

  const handleActionSuccess = (updatedBooking) => {
    if (onActionSuccess) {
      onActionSuccess(updatedBooking);
    }
  };

  if (compact) {
    return (
      <>
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

        {/* Self-hosted dialogs if not orchestrated externally */}
        {!onCancelClick && isInternalCancelOpen && (
          <CancelBookingDialog
            isOpen={isInternalCancelOpen}
            onClose={() => setIsInternalCancelOpen(false)}
            booking={booking}
            onSuccess={handleActionSuccess}
          />
        )}

        {!onRescheduleClick && isInternalRescheduleOpen && (
          <RescheduleBookingDialog
            isOpen={isInternalRescheduleOpen}
            onClose={() => setIsInternalRescheduleOpen(false)}
            booking={booking}
            onSuccess={handleActionSuccess}
          />
        )}
      </>
    );
  }

  return (
    <>
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

      {/* Self-hosted dialogs if not orchestrated externally */}
      {!onCancelClick && isInternalCancelOpen && (
        <CancelBookingDialog
          isOpen={isInternalCancelOpen}
          onClose={() => setIsInternalCancelOpen(false)}
          booking={booking}
          onSuccess={handleActionSuccess}
        />
      )}

      {!onRescheduleClick && isInternalRescheduleOpen && (
        <RescheduleBookingDialog
          isOpen={isInternalRescheduleOpen}
          onClose={() => setIsInternalRescheduleOpen(false)}
          booking={booking}
          onSuccess={handleActionSuccess}
        />
      )}
    </>
  );
}
