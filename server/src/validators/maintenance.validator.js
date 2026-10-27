import { ApiError } from '../utils/ApiError.js';
import { isValidObjectId, validatePagination } from './common.js';
import { isValidIsoInstant } from './booking.validator.js';

/**
 * Allowed fields for creating a maintenance block.
 * Internal fields (id, createdBy, createdAt, updatedAt) are strictly rejected.
 */
const ALLOWED_MAINTENANCE_CREATE_FIELDS = ['startAt', 'endAt', 'reason'];

/**
 * Allowed query parameters for listing maintenance blocks.
 */
const ALLOWED_MAINTENANCE_QUERY_PARAMS = ['page', 'limit', 'fromDate', 'toDate'];

/**
 * Express middleware to validate :maintenanceId route parameter.
 */
export function validateMaintenanceIdParam(req, res, next) {
  const { maintenanceId } = req.params;

  if (!maintenanceId || !isValidObjectId(maintenanceId)) {
    return next(
      ApiError.badRequest(
        'Invalid maintenance block identifier format.',
        'INVALID_PARAMETER',
        { maintenanceId: 'Must be a valid 24-character hexadecimal ObjectId.' },
      ),
    );
  }

  next();
}

/**
 * Express middleware to validate request payload for creating a maintenance block.
 * POST /api/v1/admin/resources/:resourceId/maintenance
 */
export function validateCreateMaintenanceBlock(req, res, next) {
  const errors = {};

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return next(
      ApiError.badRequest('Request body must be a valid JSON object.', 'INVALID_JSON_BODY'),
    );
  }

  // 1. Mass assignment protection: Reject unexpected or untrusted fields
  const payloadKeys = Object.keys(req.body);
  for (const key of payloadKeys) {
    if (!ALLOWED_MAINTENANCE_CREATE_FIELDS.includes(key)) {
      errors[key] = `Field '${key}' is not permitted. Only [${ALLOWED_MAINTENANCE_CREATE_FIELDS.join(', ')}] are allowed.`;
    }
  }

  const { startAt, endAt, reason } = req.body;

  // 2. Validate startAt
  let parsedStart = null;
  if (!startAt) {
    errors.startAt = 'Maintenance start timestamp (startAt) is required.';
  } else if (!isValidIsoInstant(startAt)) {
    errors.startAt = 'startAt must be a valid ISO 8601 timestamp with explicit time zone indicator (e.g. 2026-10-28T10:00:00Z).';
  } else {
    parsedStart = new Date(startAt);
  }

  // 3. Validate endAt
  let parsedEnd = null;
  if (!endAt) {
    errors.endAt = 'Maintenance end timestamp (endAt) is required.';
  } else if (!isValidIsoInstant(endAt)) {
    errors.endAt = 'endAt must be a valid ISO 8601 timestamp with explicit time zone indicator (e.g. 2026-10-28T12:00:00Z).';
  } else {
    parsedEnd = new Date(endAt);
  }

  // 4. Validate interval consistency: [startAt, endAt)
  if (parsedStart && parsedEnd) {
    const startMs = parsedStart.getTime();
    const endMs = parsedEnd.getTime();
    const nowMs = Date.now();

    if (startMs >= endMs) {
      errors.endAt = 'Maintenance end time must be strictly later than start time [startAt, endAt).';
    } else if (endMs <= nowMs) {
      errors.endAt = 'Maintenance interval must not be entirely in the past.';
    }
  }

  // 5. Validate reason if provided
  if (reason !== undefined && reason !== null) {
    if (typeof reason !== 'string') {
      errors.reason = 'Maintenance reason must be a string.';
    } else if (reason.trim().length === 0) {
      errors.reason = 'Maintenance reason cannot be blank.';
    } else if (reason.trim().length > 500) {
      errors.reason = 'Maintenance reason cannot exceed 500 characters.';
    }
  }

  if (Object.keys(errors).length > 0) {
    return next(
      ApiError.badRequest(
        'Validation failed for maintenance block creation.',
        'VALIDATION_ERROR',
        errors,
      ),
    );
  }

  req.validatedBody = {
    startAt: parsedStart,
    endAt: parsedEnd,
    reason: typeof reason === 'string' && reason.trim() ? reason.trim() : 'Scheduled maintenance',
  };

  next();
}

/**
 * Express middleware to validate query parameters for listing maintenance blocks.
 * GET /api/v1/admin/resources/:resourceId/maintenance
 */
export function validateListMaintenanceQuery(req, res, next) {
  const errors = {};
  const query = req.query || {};

  // 1. Check for unpermitted query keys
  const queryKeys = Object.keys(query);
  for (const key of queryKeys) {
    if (!ALLOWED_MAINTENANCE_QUERY_PARAMS.includes(key)) {
      errors[key] = `Query parameter '${key}' is not recognized or permitted.`;
    }
  }

  // 2. Validate pagination
  const paginationResult = validatePagination(query);
  if (!paginationResult.isValid && paginationResult.errors) {
    Object.assign(errors, paginationResult.errors);
  }

  // 3. Validate fromDate and toDate filters if provided
  let validatedFromDate = null;
  let validatedToDate = null;

  if (query.fromDate !== undefined && query.fromDate !== '') {
    const fromStr = query.fromDate.trim();
    const fromDateObj = new Date(fromStr);
    if (Number.isNaN(fromDateObj.getTime())) {
      errors.fromDate = 'fromDate must be a valid date or timestamp string.';
    } else {
      validatedFromDate = fromDateObj;
    }
  }

  if (query.toDate !== undefined && query.toDate !== '') {
    const toStr = query.toDate.trim();
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
        'Validation failed for maintenance query parameters.',
        'VALIDATION_ERROR',
        errors,
      ),
    );
  }

  req.validatedQuery = {
    page: paginationResult.page,
    limit: paginationResult.limit,
    fromDate: validatedFromDate,
    toDate: validatedToDate,
  };

  next();
}

export default {
  validateMaintenanceIdParam,
  validateCreateMaintenanceBlock,
  validateListMaintenanceQuery,
};
