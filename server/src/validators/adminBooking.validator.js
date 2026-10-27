import { ApiError } from '../utils/ApiError.js';
import { isValidObjectId, validatePagination, validateEnum } from './common.js';
import { BOOKING_STATUSES } from '../models/Booking.js';
import { RESOURCE_CATEGORIES } from '../models/Resource.js';

/**
 * Allowed query parameters for administrative booking inspection.
 * Any other parameter keys will be strictly rejected to prevent unexpected behavior.
 */
const ALLOWED_ADMIN_BOOKING_QUERY_PARAMS = [
  'page',
  'limit',
  'status',
  'resourceId',
  'userId',
  'category',
  'fromDate',
  'toDate',
  'sortBy',
  'sortOrder',
];

/**
 * Allowed fields for sorting administrative booking listings.
 */
const ALLOWED_ADMIN_BOOKING_SORT_FIELDS = [
  'startAt',
  'createdAt',
  'endAt',
  'status',
];

/**
 * Allowed fields for administrative booking cancellation.
 * Only an optional cancellation reason is accepted.
 */
const ALLOWED_ADMIN_CANCEL_FIELDS = ['reason'];

/**
 * Express middleware to validate query parameters for administrative booking listings.
 * GET /api/v1/admin/bookings
 */
export function validateAdminBookingQuery(req, res, next) {
  const errors = {};
  const query = req.query || {};

  // 1. Check for unpermitted query keys
  const queryKeys = Object.keys(query);
  for (const key of queryKeys) {
    if (!ALLOWED_ADMIN_BOOKING_QUERY_PARAMS.includes(key)) {
      errors[key] = `Query parameter '${key}' is not recognized or permitted.`;
    }
  }

  // 2. Validate pagination
  const paginationResult = validatePagination(query);
  if (!paginationResult.isValid && paginationResult.errors) {
    Object.assign(errors, paginationResult.errors);
  }

  // 3. Validate status filter if provided
  let validatedStatus = null;
  if (query.status !== undefined && query.status !== '' && query.status !== 'all') {
    const statusVal = query.status.trim();
    const enumResult = validateEnum(statusVal, BOOKING_STATUSES, 'status');
    if (!enumResult.isValid) {
      errors.status = enumResult.error;
    } else {
      validatedStatus = statusVal;
    }
  }

  // 4. Validate resourceId filter if provided
  let validatedResourceId = null;
  if (query.resourceId !== undefined && query.resourceId !== '') {
    const resId = query.resourceId.trim();
    if (!isValidObjectId(resId)) {
      errors.resourceId = 'resourceId must be a valid 24-character hexadecimal ObjectId.';
    } else {
      validatedResourceId = resId;
    }
  }

  // 5. Validate userId filter if provided
  let validatedUserId = null;
  if (query.userId !== undefined && query.userId !== '') {
    const uId = query.userId.trim();
    if (!isValidObjectId(uId)) {
      errors.userId = 'userId must be a valid 24-character hexadecimal ObjectId.';
    } else {
      validatedUserId = uId;
    }
  }

  // 6. Validate category filter if provided
  let validatedCategory = null;
  if (query.category !== undefined && query.category !== '') {
    const catVal = query.category.trim();
    const enumResult = validateEnum(catVal, RESOURCE_CATEGORIES, 'category');
    if (!enumResult.isValid) {
      errors.category = enumResult.error;
    } else {
      validatedCategory = catVal;
    }
  }

  // 7. Validate fromDate and toDate filters if provided
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

  // 8. Validate sorting parameters
  let validatedSortBy = 'startAt';
  if (query.sortBy !== undefined && query.sortBy !== '') {
    const sortVal = query.sortBy.trim();
    const sortCheck = validateEnum(sortVal, ALLOWED_ADMIN_BOOKING_SORT_FIELDS, 'sortBy');
    if (!sortCheck.isValid) {
      errors.sortBy = sortCheck.error;
    } else {
      validatedSortBy = sortVal;
    }
  }

  let validatedSortOrder = -1; // Default descending
  if (query.sortOrder !== undefined && query.sortOrder !== '') {
    const orderVal = query.sortOrder.trim().toLowerCase();
    if (orderVal !== 'asc' && orderVal !== 'desc') {
      errors.sortOrder = "sortOrder must be either 'asc' or 'desc'.";
    } else {
      validatedSortOrder = orderVal === 'asc' ? 1 : -1;
    }
  }

  if (Object.keys(errors).length > 0) {
    return next(
      ApiError.badRequest(
        'Validation failed for administrative booking query parameters.',
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
    userId: validatedUserId,
    category: validatedCategory,
    fromDate: validatedFromDate,
    toDate: validatedToDate,
    sortBy: validatedSortBy,
    sortOrder: validatedSortOrder,
  };

  next();
}

/**
 * Express middleware to validate request payload for administrative booking cancellation.
 * PATCH /api/v1/admin/bookings/:bookingId/cancel
 */
export function validateAdminCancelBooking(req, res, next) {
  const errors = {};

  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    const payloadKeys = Object.keys(req.body);
    for (const key of payloadKeys) {
      if (!ALLOWED_ADMIN_CANCEL_FIELDS.includes(key)) {
        errors[key] = `Field '${key}' is not permitted during administrative cancellation. Only [${ALLOWED_ADMIN_CANCEL_FIELDS.join(', ')}] are allowed.`;
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
        'Validation failed for administrative cancellation request.',
        'VALIDATION_ERROR',
        errors,
      ),
    );
  }

  req.validatedBody = {
    reason: typeof req.body?.reason === 'string' && req.body.reason.trim()
      ? req.body.reason.trim()
      : null,
  };

  next();
}

export default {
  validateAdminBookingQuery,
  validateAdminCancelBooking,
};
