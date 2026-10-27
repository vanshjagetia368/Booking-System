import mongoose from 'mongoose';

/**
 * Common reusable validation primitives and helper functions.
 */

export function isValidObjectId(value) {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

export function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  // Standard RFC-compliant email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value.trim());
}

export function isValidIsoDate(value) {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && value.includes('T');
}

export function isNonEmptyString(value, min = 1, max = 1000) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length >= min && trimmed.length <= max;
}

export function isPositiveInteger(value) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

/**
 * Validates half-open booking intervals: [start, end)
 * Enforces start < end and valid dates.
 *
 * @param {string | Date} start
 * @param {string | Date} end
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateInterval(start, end) {
  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end instanceof Date ? end : new Date(end);

  if (Number.isNaN(startDate.getTime())) {
    return { isValid: false, error: 'Start time must be a valid ISO 8601 date string.' };
  }

  if (Number.isNaN(endDate.getTime())) {
    return { isValid: false, error: 'End time must be a valid ISO 8601 date string.' };
  }

  if (startDate >= endDate) {
    return { isValid: false, error: 'Start time must be strictly before end time [start, end).' };
  }

  return { isValid: true };
}

export default {
  isValidObjectId,
  isValidEmail,
  isValidIsoDate,
  isNonEmptyString,
  isPositiveInteger,
  validateInterval,
};
