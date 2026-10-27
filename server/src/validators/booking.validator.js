import { ApiError } from '../utils/ApiError.js';
import { isValidObjectId, validatePagination, validateEnum } from './common.js';
import { BOOKING_STATUSES } from '../models/Booking.js';

/**
 * Allowed fields for creating a booking.
 * All other fields (e.g. userId, status, cancellationReason, createdAt) are strictly prohibited.
 */
const ALLOWED_CREATE_FIELDS = ['resourceId', 'startAt', 'endAt', 'notes'];

/**
 * Allowed fields for cancelling a booking.
 */
const ALLOWED_CANCEL_FIELDS = ['reason'];

/**
 * Allowed fields for rescheduling a booking.
 */
const ALLOWED_RESCHEDULE_FIELDS = ['startAt', 'endAt'];

/**
 * Allowed query parameters for booking history inspection.
 */
const ALLOWED_HISTORY_QUERY_PARAMS = ['page', 'limit', 'status', 'resourceId', 'fromDate', 'toDate'];

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
 * Middleware to validate :bookingId route parameter.
 */
export function validateBookingIdParam(req, res, next) {
  const { bookingId } = req.params;

  if (!bookingId || !isValidObjectId(bookingId)) {
    return next(
      ApiError.badRequest(
        'Invalid booking identifier format.',
        'INVALID_PARAMETER',
        { bookingId: 'Must be a valid 24-character hexadecimal ObjectId.' },
      ),
    );
  }

  next();
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
    if (!ALLOWED_CREATE_FIELDS.includes(key)) {
      errors[key] = `Field '${key}' is not permitted. Only [${ALLOWED_CREATE_FIELDS.join(', ')}] are allowed.`;
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

/**
 * Express middleware to validate GET /api/v1/bookings/my query parameters.
 */
export function validateBookingHistoryQuery(req, res, next) {
  const errors = {};

  // 1. Check for unpermitted query keys
  const queryKeys = Object.keys(req.query);
  for (const key of queryKeys) {
    if (!ALLOWED_HISTORY_QUERY_PARAMS.includes(key)) {
      errors[key] = `Query parameter '${key}' is not recognized or permitted.`;
    }
  }

  // 2. Validate pagination
  const paginationResult = validatePagination(req.query);
  if (!paginationResult.isValid && paginationResult.errors) {
    Object.assign(errors, paginationResult.errors);
  }

  // 3. Validate status filter if provided
  let validatedStatus = null;
  if (req.query.status !== undefined && req.query.status !== '') {
    const statusVal = req.query.status.trim();
    const enumResult = validateEnum(statusVal, BOOKING_STATUSES, 'status');
    if (!enumResult.isValid) {
      errors.status = enumResult.error;
    } else {
      validatedStatus = statusVal;
    }
  }

  // 4. Validate resourceId filter if provided
  let validatedResourceId = null;
  if (req.query.resourceId !== undefined && req.query.resourceId !== '') {
    const resId = req.query.resourceId.trim();
    if (!isValidObjectId(resId)) {
      errors.resourceId = 'resourceId must be a valid 24-character hexadecimal ObjectId.';
    } else {
      validatedResourceId = resId;
    }
  }

  // 5. Validate fromDate / toDate filters if provided
  let validatedFromDate = null;
  let validatedToDate = null;

  if (req.query.fromDate !== undefined && req.query.fromDate !== '') {
    const fromStr = req.query.fromDate.trim();
    const fromDateObj = new Date(fromStr);
    if (Number.isNaN(fromDateObj.getTime())) {
      errors.fromDate = 'fromDate must be a valid date or timestamp string.';
    } else {
      validatedFromDate = fromDateObj;
    }
  }

  if (req.query.toDate !== undefined && req.query.toDate !== '') {
    const toStr = req.query.toDate.trim();
    const toDateObj = new Date(toStr);
    if (Number.isNaN(toDateObj.getTime())) {
      errors.toDate = 'toDate must be a valid date or timestamp string.';
    } else {
      validatedToDate = toDateObj;
    }
  }

  if (validatedFromDate && validatedToDate && validatedFromDate > validatedToDate) {
    errors.toDate = 'toDate must be equal to or later than fromDate.';
  }

  if (Object.keys(errors).length > 0) {
    return next(
      ApiError.badRequest(
        'Validation failed for one or more query parameters.',
        'VALIDATION_ERROR',
        errors,
      ),
    );
  }

  req.validatedQuery = {
    page: paginationResult.page,
    limit: paginationResult.limit,
    status: validatedStatus,
    resourceId: validatedResourceId,
    fromDate: validatedFromDate,
    toDate: validatedToDate,
  };

  next();
}

/**
 * Express middleware to validate PATCH /api/v1/bookings/:bookingId/cancel request payload.
 */
export function validateCancelBooking(req, res, next) {
  const errors = {};

  // Body is optional, but if supplied, must be an object
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    const payloadKeys = Object.keys(req.body);
    for (const key of payloadKeys) {
      if (!ALLOWED_CANCEL_FIELDS.includes(key)) {
        errors[key] = `Field '${key}' is not permitted during cancellation. Only [${ALLOWED_CANCEL_FIELDS.join(', ')}] are allowed.`;
      }
    }

    if (req.body.reason !== undefined && req.body.reason !== null) {
      if (typeof req.body.reason !== 'string') {
        errors.reason = 'Cancellation reason must be a string.';
      } else if (req.body.reason.trim().length > 500) {
        errors.reason = 'Cancellation reason cannot exceed 500 characters.';
      }
    }
  } else if (req.body !== undefined && (typeof req.body !== 'object' || Array.isArray(req.body))) {
    return next(
      ApiError.badRequest('Request body must be a valid JSON object.', 'INVALID_JSON_BODY'),
    );
  }

  if (Object.keys(errors).length > 0) {
    return next(
      ApiError.badRequest(
        'Validation failed for cancellation request.',
        'VALIDATION_ERROR',
        errors,
      ),
    );
  }

  req.validatedBody = {
    reason: typeof req.body?.reason === 'string' ? req.body.reason.trim() : null,
  };

  next();
}

/**
 * Express middleware to validate PATCH /api/v1/bookings/:bookingId/reschedule request payload.
 */
export function validateRescheduleBooking(req, res, next) {
  const errors = {};

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return next(
      ApiError.badRequest('Request body must be a valid JSON object.', 'INVALID_JSON_BODY'),
    );
  }

  // Mass assignment defense
  const payloadKeys = Object.keys(req.body);
  for (const key of payloadKeys) {
    if (!ALLOWED_RESCHEDULE_FIELDS.includes(key)) {
      errors[key] = `Field '${key}' is not permitted during rescheduling. Only [${ALLOWED_RESCHEDULE_FIELDS.join(', ')}] are allowed.`;
    }
  }

  const { startAt, endAt } = req.body;

  let parsedStart = null;
  if (!startAt) {
    errors.startAt = 'Rescheduled start timestamp (startAt) is required.';
  } else if (!isValidIsoInstant(startAt)) {
    errors.startAt = 'startAt must be a valid ISO 8601 timestamp with explicit time zone indicator (e.g. 2026-10-28T10:00:00Z).';
  } else {
    parsedStart = new Date(startAt);
  }

  let parsedEnd = null;
  if (!endAt) {
    errors.endAt = 'Rescheduled end timestamp (endAt) is required.';
  } else if (!isValidIsoInstant(endAt)) {
    errors.endAt = 'endAt must be a valid ISO 8601 timestamp with explicit time zone indicator (e.g. 2026-10-28T11:00:00Z).';
  } else {
    parsedEnd = new Date(endAt);
  }

  // Cross-field interval invariants: [startAt, endAt)
  if (parsedStart && parsedEnd) {
    const startMs = parsedStart.getTime();
    const endMs = parsedEnd.getTime();
    const nowMs = Date.now();

    if (startMs >= endMs) {
      errors.endAt = 'Rescheduled end time must be strictly later than start time [startAt, endAt).';
    } else if (startMs <= nowMs) {
      errors.startAt = 'Rescheduled start time must be in the future.';
    } else if (startMs > nowMs + MAX_ADVANCE_BOOKING_MS) {
      errors.startAt = 'Reservations cannot be scheduled more than 90 days in advance.';
    }
  }

  if (Object.keys(errors).length > 0) {
    return next(
      ApiError.badRequest(
        'Validation failed for rescheduling request.',
        'VALIDATION_ERROR',
        errors,
      ),
    );
  }

  req.validatedBody = {
    startAt: parsedStart,
    endAt: parsedEnd,
  };

  next();
}

export default {
  validateBookingIdParam,
  validateCreateBooking,
  validateBookingHistoryQuery,
  validateCancelBooking,
  validateRescheduleBooking,
  isValidIsoInstant,
};
