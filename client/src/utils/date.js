/**
 * Shared date and time formatting utilities.
 * Designed to support half-open intervals [start, end) and booking schedules.
 */

/**
 * Parses an input value into a valid Date object or null.
 *
 * @param {string | number | Date | null | undefined} value
 * @returns {Date | null}
 */
export function toValidDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Formats a date string or timestamp into a readable date string.
 * Example output: "Oct 27, 2026"
 *
 * @param {string | number | Date} value
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export function formatDate(value, options = {}) {
  const date = toValidDate(value);
  if (!date) return 'Invalid date';

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date);
}

/**
 * Formats a time string or timestamp into 12-hour or 24-hour time.
 * Example output: "09:30 AM"
 *
 * @param {string | number | Date} value
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export function formatTime(value, options = {}) {
  const date = toValidDate(value);
  if (!date) return 'Invalid time';

  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date);
}

/**
 * Formats a half-open interval [start, end) into a clean time range.
 * Example output: "09:00 AM – 10:30 AM"
 *
 * @param {string | number | Date} startValue
 * @param {string | number | Date} endValue
 * @returns {string}
 */
export function formatTimeRange(startValue, endValue) {
  const start = toValidDate(startValue);
  const end = toValidDate(endValue);

  if (!start || !end) return 'Invalid time range';

  const formattedStart = formatTime(start);
  const formattedEnd = formatTime(end);

  return `${formattedStart} – ${formattedEnd}`;
}

/**
 * Formats a duration in minutes into a human-readable string.
 * Example: 30 -> "30m", 60 -> "1h", 90 -> "1h 30m"
 *
 * @param {number} minutes
 * @returns {string}
 */
export function formatDuration(minutes) {
  if (typeof minutes !== 'number' || Number.isNaN(minutes) || minutes < 0) {
    return '0m';
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}
