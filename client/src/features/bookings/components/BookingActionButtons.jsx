import Button from '../../../components/ui/Button.jsx';
import { canCancelBooking, canRescheduleBooking } from '../utils/bookingPolicyUtils.js';

/**
 * BookingActionButtons Component
 *
 * Renders cancellation and rescheduling action buttons for an eligible booking.
 *
 * @param {object} props
 * @param {object} props.booking - Booking record
 * @param {Function} props.onCancel - Cancellation click handler
 * @param {Function} props.onReschedule - Rescheduling click handler
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Button size
 * @param {string} [props.className='']
 */
export default function BookingActionButtons({
  booking,
  onCancel,
  onReschedule,
  size = 'md',
  className = '',
}) {
  if (!booking) return null;

  const isCancellable = canCancelBooking(booking);
  const isReschedulable = canRescheduleBooking(booking);

  if (!isCancellable && !isReschedulable) {
    return null;
  }

  return (
    <div className={`booking-action-buttons ${className}`.trim()}>
      {isReschedulable && (
        <Button
          variant="secondary"
          size={size}
          onClick={() => onReschedule?.(booking)}
          aria-label={`Reschedule reservation for ${booking.resource?.name || 'facility'}`}
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
          Reschedule
        </Button>
      )}

      {isCancellable && (
        <Button
          variant="outline"
          size={size}
          onClick={() => onCancel?.(booking)}
          className="booking-action-buttons__cancel-btn"
          aria-label={`Cancel reservation for ${booking.resource?.name || 'facility'}`}
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
          Cancel
        </Button>
      )}
    </div>
  );
}
