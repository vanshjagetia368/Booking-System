/**
 * Availability and Calendar Utilities
 *
 * Provides safe date-only string manipulation, slot time interval formatting,
 * and status mapping without time-zone shifting pitfalls.
 */

/**
 * Returns today's date formatted as YYYY-MM-DD in the local calendar.
 *
 * @returns {string} YYYY-MM-DD
 */
export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds or subtracts days from a YYYY-MM-DD string without time-zone shifting.
 *
 * @param {string} dateString - YYYY-MM-DD
 * @param {number} days - Integer number of days to offset
 * @returns {string} YYYY-MM-DD
 */
export function addDaysToDateString(dateString, days) {
  if (!dateString || typeof dateString !== 'string') {
    return getTodayDateString();
  }

  const [yearStr, monthStr, dayStr] = dateString.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const targetDate = new Date(year, month - 1, day + days);
  const targetYear = targetDate.getFullYear();
  const targetMonth = String(targetDate.getMonth() + 1).padStart(2, '0');
  const targetDay = String(targetDate.getDate()).padStart(2, '0');

  return `${targetYear}-${targetMonth}-${targetDay}`;
}

/**
 * Returns the maximum advance booking date string (defaults to 90 days).
 *
 * @param {number} [days=90]
 * @returns {string} YYYY-MM-DD
 */
export function getMaxAdvanceDateString(days = 90) {
  return addDaysToDateString(getTodayDateString(), days);
}

/**
 * Validates whether a string matches the calendar format YYYY-MM-DD.
 *
 * @param {string} dateString
 * @returns {boolean}
 */
export function isValidCalendarDate(dateString) {
  if (!dateString || typeof dateString !== 'string') return false;
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 2000 || year > 2100) return false;
  if (month < 1 || month > 12) return false;

  const test = new Date(year, month - 1, day);
  return (
    test.getFullYear() === year &&
    test.getMonth() === month - 1 &&
    test.getDate() === day
  );
}

/**
 * Formats a calendar date string (YYYY-MM-DD) into a human-readable title.
 * Avoids UTC shifting by constructing the Date with local year, month, day.
 * Example: "2026-10-28" -> "Wednesday, October 28, 2026"
 *
 * @param {string} dateString - YYYY-MM-DD
 * @returns {string}
 */
export function formatCalendarDate(dateString) {
  if (!isValidCalendarDate(dateString)) {
    return 'Invalid date';
  }

  const [yearStr, monthStr, dayStr] = dateString.split('-');
  const date = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Formats an ISO 8601 timestamp string into a clean 12-hour or 24-hour time.
 * Example: "2026-10-28T09:00:00.000Z" -> "09:00 AM"
 *
 * @param {string | Date} isoInstant
 * @param {string} [timeZone] - Optional IANA time zone (e.g. "UTC" or "America/New_York")
 * @returns {string}
 */
export function formatSlotTime(isoInstant, timeZone) {
  if (!isoInstant) return '--:--';
  const date = new Date(isoInstant);
  if (Number.isNaN(date.getTime())) return '--:--';

  const options = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  if (timeZone) {
    try {
      options.timeZone = timeZone;
    } catch {
      // Fall back to default if invalid time zone identifier
    }
  }

  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Formats a half-open interval [startAt, endAt) for a slot.
 * Example: "09:00 AM – 09:30 AM"
 *
 * @param {string} startAt - ISO 8601 instant
 * @param {string} endAt - ISO 8601 instant
 * @param {string} [timeZone]
 * @returns {string}
 */
export function formatSlotInterval(startAt, endAt, timeZone) {
  const startStr = formatSlotTime(startAt, timeZone);
  const endStr = formatSlotTime(endAt, timeZone);
  return `${startStr} – ${endStr}`;
}

/**
 * Translates an API slot unavailability reason into a user-friendly label.
 *
 * @param {string | null} reason - "PAST_TIME" | "MAINTENANCE" | "RESERVED" | null
 * @returns {string}
 */
export function getSlotReasonDescription(reason) {
  switch (reason) {
    case 'PAST_TIME':
      return 'Past time';
    case 'MAINTENANCE':
      return 'Under maintenance';
    case 'RESERVED':
      return 'Already booked';
    default:
      return 'Unavailable';
  }
}
