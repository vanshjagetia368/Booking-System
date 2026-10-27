import {
  canCancelBooking,
  canRescheduleBooking,
  isBookingStarted,
  getActionIneligibilityReason,
} from './bookingFormatters.js';

export {
  canCancelBooking,
  canRescheduleBooking,
  isBookingStarted,
  getActionIneligibilityReason,
};

/**
 * Returns user-facing cancellation policy information for a booking.
 *
 * @param {object} booking
 * @returns {{ title: string, description: string, isEligible: boolean }}
 */
export function getCancellationPolicyInfo(booking) {
  const isEligible = canCancelBooking(booking);
  const ineligibilityReason = getActionIneligibilityReason(booking);

  if (!isEligible) {
    return {
      title: 'Cancellation Ineligible',
      description: ineligibilityReason || 'This reservation cannot be cancelled under current policies.',
      isEligible: false,
    };
  }

  return {
    title: 'Cancellation Policy',
    description:
      'You may cancel any confirmed upcoming reservation prior to its start time. Cancelling immediately releases your reserved time slot for other campus users. This action cannot be reversed.',
    isEligible: true,
  };
}

/**
 * Returns user-facing rescheduling policy information for a booking.
 *
 * @param {object} booking
 * @returns {{ title: string, description: string, isEligible: boolean }}
 */
export function getReschedulingPolicyInfo(booking) {
  const isEligible = canRescheduleBooking(booking);
  const ineligibilityReason = getActionIneligibilityReason(booking);

  if (!isEligible) {
    return {
      title: 'Rescheduling Ineligible',
      description: ineligibilityReason || 'This reservation cannot be rescheduled under current policies.',
      isEligible: false,
    };
  }

  return {
    title: 'Rescheduling Policy',
    description:
      'You can reschedule this reservation to any unreserved time slot on the same facility within the next 90 days. The change is processed atomically — if the replacement interval is unavailable, your original booking remains completely intact.',
    isEligible: true,
  };
}

/**
 * Translates backend operational error codes into user-friendly diagnostic messages.
 *
 * @param {object | string} error - Error object or error code
 * @param {string} [fallback='An error occurred while processing your request.']
 * @returns {string}
 */
export function getPolicyViolationMessage(error, fallback = 'An error occurred while processing your request.') {
  const code = typeof error === 'string' ? error : error?.code;
  const serverMsg = typeof error === 'object' ? error?.message : null;

  switch (code) {
    case 'BOOKING_ALREADY_CANCELLED':
      return 'This reservation has already been cancelled and cannot be modified again.';
    case 'INVALID_BOOKING_TRANSITION':
      return 'Only confirmed reservations can be modified or cancelled.';
    case 'BOOKING_ALREADY_STARTED':
      return 'Reservations that have already begun or passed cannot be cancelled or rescheduled.';
    case 'BOOKING_CONFLICT':
      return 'The selected replacement time slot is no longer available. Please select another slot.';
    case 'MAINTENANCE_CONFLICT':
      return 'The selected time interval conflicts with a scheduled facility maintenance blackout.';
    case 'OUTSIDE_OPERATING_HOURS':
      return 'The selected interval is outside the facility\'s operating hours schedule for that day.';
    case 'RESOURCE_INACTIVE':
      return 'This facility is currently inactive and cannot accept reservation modifications.';
    case 'INVALID_BOOKING_INTERVAL':
      return 'The selected interval is invalid or does not align with the facility\'s slot duration grid.';
    case 'BOOKING_NOT_FOUND':
      return 'The requested reservation was not found or is not accessible.';
    case 'UNAUTHENTICATED':
      return 'Your session has expired. Please sign in again to manage your reservation.';
    case 'TRANSACTIONS_UNAVAILABLE':
      return 'The reservation system is temporarily unable to process atomic slot allocation. Please try again shortly.';
    default:
      return serverMsg || fallback;
  }
}
