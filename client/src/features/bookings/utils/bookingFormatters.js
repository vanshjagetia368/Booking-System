/**
 * Booking Formatting Utilities
 *
 * Provides status label mapping, duration calculation, and reference display.
 */

/**
 * Returns display metadata for a booking status.
 *
 * @param {string} status - 'confirmed' | 'cancelled' | 'completed'
 * @returns {{ label: string, variant: 'success' | 'danger' | 'neutral' | 'warning' }}
 */
export function formatBookingStatus(status) {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return { label: 'Confirmed', variant: 'success' };
    case 'cancelled':
      return { label: 'Cancelled', variant: 'danger' };
    case 'completed':
      return { label: 'Completed', variant: 'neutral' };
    default:
      return { label: status || 'Pending', variant: 'warning' };
  }
}

/**
 * Formats a 24-character hexadecimal ObjectId into a readable booking reference code.
 * Example: "671e...3f" -> "#3F-..."
 *
 * @param {string} bookingId
 * @returns {string}
 */
export function formatBookingReference(bookingId) {
  if (!bookingId || typeof bookingId !== 'string') {
    return '#UNKNOWN';
  }
  // Return readable uppercase 8-char suffix for compact UI displays
  const suffix = bookingId.length > 8 ? bookingId.slice(-8).toUpperCase() : bookingId.toUpperCase();
  return `#${suffix}`;
}

/**
 * Calculates duration in minutes from half-open interval [startAt, endAt).
 *
 * @param {string | Date} startAt
 * @param {string | Date} endAt
 * @returns {number} Duration in minutes
 */
export function calculateBookingDurationMinutes(startAt, endAt) {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return 0;
  }

  return Math.round((end - start) / (1000 * 60));
}

/**
 * Checks whether a booking end time has already elapsed.
 *
 * @param {string | Date} endAt
 * @param {Date} [now=new Date()]
 * @returns {boolean}
 */
export function isPastBooking(endAt, now = new Date()) {
  const end = new Date(endAt).getTime();
  return !Number.isNaN(end) && end <= now.getTime();
}

/**
 * Checks whether a booking start time has already begun or passed.
 *
 * @param {string | Date} startAt
 * @param {Date} [now=new Date()]
 * @returns {boolean}
 */
export function isBookingStarted(startAt, now = new Date()) {
  const start = new Date(startAt).getTime();
  return !Number.isNaN(start) && start <= now.getTime();
}

/**
 * Evaluates whether a booking meets backend policy eligibility for cancellation.
 * Policy: status must be 'confirmed' AND startAt must be in the future (> Date.now()).
 *
 * @param {object} booking
 * @param {Date} [now=new Date()]
 * @returns {boolean}
 */
export function canCancelBooking(booking, now = new Date()) {
  if (!booking || booking.status !== 'confirmed') return false;
  const startMs = new Date(booking.startAt).getTime();
  return !Number.isNaN(startMs) && startMs > now.getTime();
}

/**
 * Evaluates whether a booking meets backend policy eligibility for rescheduling.
 * Policy: status must be 'confirmed' AND startAt must be in the future (> Date.now()).
 *
 * @param {object} booking
 * @param {Date} [now=new Date()]
 * @returns {boolean}
 */
export function canRescheduleBooking(booking, now = new Date()) {
  if (!booking || booking.status !== 'confirmed') return false;
  const startMs = new Date(booking.startAt).getTime();
  return !Number.isNaN(startMs) && startMs > now.getTime();
}

/**
 * Returns an explanatory reason string why a booking cannot be cancelled or rescheduled,
 * or null if the booking is fully eligible.
 *
 * @param {object} booking
 * @param {Date} [now=new Date()]
 * @returns {string | null}
 */
export function getActionIneligibilityReason(booking, now = new Date()) {
  if (!booking) return null;

  if (booking.status === 'cancelled') {
    return 'This reservation has been cancelled and cannot be modified.';
  }

  if (booking.status === 'completed') {
    return 'This reservation has already concluded.';
  }

  if (booking.status === 'confirmed') {
    const startMs = new Date(booking.startAt).getTime();
    if (!Number.isNaN(startMs) && startMs <= now.getTime()) {
      return 'This reservation is currently in progress or past its scheduled start time and can no longer be modified or cancelled.';
    }
  }

  return null;
}
