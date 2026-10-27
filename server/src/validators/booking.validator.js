import { ApiError } from '../utils/ApiError.js';
import { isValidObjectId } from './common.js';

/**
 * Allowed fields for creating a booking.
 * All other fields (e.g. userId, status, cancellationReason, createdAt) are strictly prohibited.
 */
const ALLOWED_BOOKING_FIELDS = ['resourceId', 'startAt', 'endAt', 'notes'];

/**
 * Strict ISO 8601 regex pattern matching unambiguous instants with UTC ('Z') or offset (+/-HH:mm).
 * Examples:
 * - 2026-10-28T10:00:00Z
 * - 2026-10-28T10:00:00.000Z
 * - 2026-10-28T10:00:00+00:00
 */
const ISO_8601_INSTANT_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:?\d{2})$/;

/**
 * Maximum booking advance window in milliseconds (90 days).
 */
const MAX_ADVANCE_BOOKING_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Checks if a string represents an unambiguous ISO 8601 instant.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidIsoInstant(value) {
  if (typeof value !== 'string') return false;
  if (!ISO_8601_INSTANT_REGEX.test(value.trim())) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

/**
 * Express middleware to validate POST /api/v1/bookings request payload.
 */
export function validateCreateBooking(req, res, next) {
  const errors = {};

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return next(
      ApiError.badRequest('Request body must be a valid JSON object.', 'INVALID_JSON_BODY'),
    );
  }

  // 1. Mass assignment defense: Reject unexpected or server-managed fields
  const payloadKeys = Object.keys(req.body);
  for (const key of payloadKeys) {
    if (!ALLOWED_BOOKING_FIELDS.includes(key)) {
      errors[key] = `Field '${key}' is not permitted. Only [${ALLOWED_BOOKING_FIELDS.join(', ')}] are allowed.`;
    }
  }

  const { resourceId, startAt, endAt, notes } = req.body;

  // 2. Validate resourceId
  if (!resourceId) {
    errors.resourceId = 'Resource identifier (resourceId) is required.';
  } else if (!isValidObjectId(resourceId)) {
    errors.resourceId = 'resourceId must be a valid 24-character hexadecimal ObjectId.';
  }

  // 3. Validate startAt
  let parsedStart = null;
  if (!startAt) {
    errors.startAt = 'Booking start timestamp (startAt) is required.';
  } else if (!isValidIsoInstant(startAt)) {
    errors.startAt = 'startAt must be a valid ISO 8601 timestamp with explicit time zone indicator (e.g. 2026-10-28T10:00:00Z).';
  } else {
    parsedStart = new Date(startAt);
  }

  // 4. Validate endAt
  let parsedEnd = null;
  if (!endAt) {
    errors.endAt = 'Booking end timestamp (endAt) is required.';
  } else if (!isValidIsoInstant(endAt)) {
    errors.endAt = 'endAt must be a valid ISO 8601 timestamp with explicit time zone indicator (e.g. 2026-10-28T11:00:00Z).';
  } else {
    parsedEnd = new Date(endAt);
  }

  // 5. Cross-field interval invariants: [startAt, endAt)
  if (parsedStart && parsedEnd) {
    const startMs = parsedStart.getTime();
    const endMs = parsedEnd.getTime();
    const nowMs = Date.now();

    if (startMs >= endMs) {
      errors.endAt = 'Booking end time must be strictly later than start time [startAt, endAt).';
    } else if (startMs <= nowMs) {
      errors.startAt = 'Booking start time must be in the future.';
    } else if (startMs > nowMs + MAX_ADVANCE_BOOKING_MS) {
      errors.startAt = 'Reservations cannot be scheduled more than 90 days in advance.';
    }
  }

  // 6. Validate optional notes
  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string') {
      errors.notes = 'Notes must be a string.';
    } else if (notes.length > 1000) {
      errors.notes = 'Notes cannot exceed 1000 characters.';
    }
  }

  if (Object.keys(errors).length > 0) {
    return next(
      ApiError.badRequest(
        'Validation failed for one or more booking fields.',
        'VALIDATION_ERROR',
        errors,
      ),
    );
  }

  // Attach sanitized fields for controller consumption
  req.validatedBody = {
    resourceId: resourceId.trim(),
    startAt: parsedStart,
    endAt: parsedEnd,
    notes: typeof notes === 'string' ? notes.trim() : '',
  };

  next();
}

export default {
  validateCreateBooking,
  isValidIsoInstant,
};
