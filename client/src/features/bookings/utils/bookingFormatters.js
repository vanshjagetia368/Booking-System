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
