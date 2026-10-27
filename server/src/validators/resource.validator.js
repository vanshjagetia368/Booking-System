import { ApiError } from '../utils/ApiError.js';
import {
  isValidObjectId,
  isNonEmptyString,
  validateEnum,
  validatePagination,
} from './common.js';
import {
  RESOURCE_CATEGORIES,
  RESOURCE_STATUSES,
  DAYS_OF_WEEK,
} from '../models/Resource.js';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const ALLOWED_CREATE_FIELDS = [
  'name',
  'description',
  'category',
  'location',
  'capacity',
  'slotDurationMinutes',
  'operatingHours',
  'timeZone',
  'status',
];

const ALLOWED_UPDATE_FIELDS = [
  'name',
  'description',
  'category',
  'location',
  'capacity',
  'slotDurationMinutes',
  'operatingHours',
  'timeZone',
  'status',
];

const ALLOWED_SORT_FIELDS = [
  'createdAt',
  'name',
  'capacity',
  'slotDurationMinutes',
  'category',
];

/**
 * Validates a single day schedule object.
 *
 * @param {object} schedule
 * @param {string} dayName
 * @returns {string | null} Error message if invalid, or null if valid
 */
export function validateDaySchedule(schedule, dayName) {
  if (typeof schedule !== 'object' || schedule === null) {
    return `${dayName} schedule must be an object.`;
  }

  if (typeof schedule.isOpen !== 'boolean') {
    return `${dayName}.isOpen must be a boolean (true or false).`;
  }

  if (schedule.isOpen) {
    if (!schedule.openTime || typeof schedule.openTime !== 'string' || !TIME_REGEX.test(schedule.openTime)) {
      return `${dayName}.openTime must be in 24-hour HH:mm format (00:00 - 23:59).`;
    }
    if (!schedule.closeTime || typeof schedule.closeTime !== 'string' || !TIME_REGEX.test(schedule.closeTime)) {
      return `${dayName}.closeTime must be in 24-hour HH:mm format (00:00 - 23:59).`;
    }
    if (schedule.openTime >= schedule.closeTime) {
      return `${dayName}.closeTime (${schedule.closeTime}) must be later than openTime (${schedule.openTime}).`;
    }
  }

  return null;
}

/**
 * Validates an operating hours object containing day schedules.
 *
 * @param {object} operatingHours
 * @returns {Record<string, string>} Map of field errors
 */
export function validateOperatingHours(operatingHours) {
  const errors = {};

  if (typeof operatingHours !== 'object' || operatingHours === null || Array.isArray(operatingHours)) {
    errors.operatingHours = 'operatingHours must be an object keyed by day of the week.';
    return errors;
  }

  const providedKeys = Object.keys(operatingHours);
  for (const key of providedKeys) {
    if (!DAYS_OF_WEEK.includes(key)) {
      errors[`operatingHours.${key}`] = `Invalid day of the week: "${key}". Must be one of: ${DAYS_OF_WEEK.join(', ')}.`;
      continue;
    }
    const dayError = validateDaySchedule(operatingHours[key], key);
    if (dayError) {
      errors[`operatingHours.${key}`] = dayError;
    }
  }

  return errors;
}

/**
 * Validates the resourceId route parameter format (MongoDB ObjectId).
 */
export function validateResourceIdParam(req, res, next) {
  const { resourceId } = req.params;

  if (!resourceId || !isValidObjectId(resourceId)) {
    return next(
      ApiError.badRequest(
        'Invalid resource identifier format.',
        'INVALID_RESOURCE_ID',
        { resourceId: 'Must be a valid 24-character hexadecimal ObjectId.' },
      ),
    );
  }

  next();
}

/**
 * Validates the request body for creating a new resource (POST /api/v1/resources).
 */
export function validateCreateResource(req, res, next) {
  const errors = {};
  const body = req.body || {};

  // Mass-assignment protection: reject unpermitted fields
  const unexpectedKeys = Object.keys(body).filter((key) => !ALLOWED_CREATE_FIELDS.includes(key));
  if (unexpectedKeys.length > 0) {
    return next(
      ApiError.badRequest(
        `Unexpected fields rejected: ${unexpectedKeys.join(', ')}.`,
        'VALIDATION_ERROR',
        { unexpectedKeys },
      ),
    );
  }

  // 1. name (required, 2-100 characters)
  if (!body.name || typeof body.name !== 'string') {
    errors.name = 'Resource name is required.';
  } else if (!isNonEmptyString(body.name, 2, 100)) {
    errors.name = 'Resource name must be between 2 and 100 characters.';
  }

  // 2. description (optional string, max 1000 characters)
  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string' || body.description.trim().length > 1000) {
      errors.description = 'Description cannot exceed 1000 characters.';
    }
  }

  // 3. category (required enum)
  if (!body.category || typeof body.category !== 'string') {
    errors.category = 'Resource category is required.';
  } else {
    const categoryCheck = validateEnum(body.category, RESOURCE_CATEGORIES, 'Category');
    if (!categoryCheck.isValid) {
      errors.category = categoryCheck.error;
    }
  }

  // 4. location (required, 2-100 characters)
  if (!body.location || typeof body.location !== 'string') {
    errors.location = 'Resource location is required.';
  } else if (!isNonEmptyString(body.location, 2, 100)) {
    errors.location = 'Resource location must be between 2 and 100 characters.';
  }

  // 5. capacity (required integer, >= 1, <= 1000)
  if (body.capacity === undefined || body.capacity === null) {
    errors.capacity = 'Resource capacity is required.';
  } else {
    const num = Number(body.capacity);
    if (!Number.isInteger(num) || num < 1 || num > 1000) {
      errors.capacity = 'Capacity must be an integer between 1 and 1000.';
    }
  }

  // 6. slotDurationMinutes (optional integer, multiple of 15, between 15 and 480)
  if (body.slotDurationMinutes !== undefined && body.slotDurationMinutes !== null) {
    const duration = Number(body.slotDurationMinutes);
    if (!Number.isInteger(duration) || duration < 15 || duration > 480 || duration % 15 !== 0) {
      errors.slotDurationMinutes = 'Slot duration must be an integer multiple of 15 minutes between 15 and 480.';
    }
  }

  // 7. operatingHours (optional object)
  if (body.operatingHours !== undefined && body.operatingHours !== null) {
    const hoursErrors = validateOperatingHours(body.operatingHours);
    Object.assign(errors, hoursErrors);
  }

  // 8. status (optional enum)
  if (body.status !== undefined && body.status !== null) {
    const statusCheck = validateEnum(body.status, RESOURCE_STATUSES, 'Status');
    if (!statusCheck.isValid) {
      errors.status = statusCheck.error;
    }
  }

  if (Object.keys(errors).length > 0) {
    return next(ApiError.badRequest('Validation failed for resource creation.', 'VALIDATION_ERROR', errors));
  }

  next();
}

/**
 * Validates the request body for updating a resource (PATCH /api/v1/resources/:resourceId).
 */
export function validateUpdateResource(req, res, next) {
  const errors = {};
  const body = req.body || {};

  // Reject empty payload
  if (Object.keys(body).length === 0) {
    return next(
      ApiError.badRequest(
        'At least one permitted field must be provided for update.',
        'VALIDATION_ERROR',
      ),
    );
  }

  // Mass-assignment protection: reject unpermitted fields
  const unexpectedKeys = Object.keys(body).filter((key) => !ALLOWED_UPDATE_FIELDS.includes(key));
  if (unexpectedKeys.length > 0) {
    return next(
      ApiError.badRequest(
        `Unexpected fields rejected: ${unexpectedKeys.join(', ')}.`,
        'VALIDATION_ERROR',
        { unexpectedKeys },
      ),
    );
  }

  // 1. name
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !isNonEmptyString(body.name, 2, 100)) {
      errors.name = 'Resource name must be between 2 and 100 characters.';
    }
  }

  // 2. description
  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string' || body.description.trim().length > 1000) {
      errors.description = 'Description cannot exceed 1000 characters.';
    }
  }

  // 3. category
  if (body.category !== undefined) {
    const categoryCheck = validateEnum(body.category, RESOURCE_CATEGORIES, 'Category');
    if (!categoryCheck.isValid) {
      errors.category = categoryCheck.error;
    }
  }

  // 4. location
  if (body.location !== undefined) {
    if (typeof body.location !== 'string' || !isNonEmptyString(body.location, 2, 100)) {
      errors.location = 'Resource location must be between 2 and 100 characters.';
    }
  }

  // 5. capacity
  if (body.capacity !== undefined) {
    const num = Number(body.capacity);
    if (!Number.isInteger(num) || num < 1 || num > 1000) {
      errors.capacity = 'Capacity must be an integer between 1 and 1000.';
    }
  }

  // 6. slotDurationMinutes
  if (body.slotDurationMinutes !== undefined) {
    const duration = Number(body.slotDurationMinutes);
    if (!Number.isInteger(duration) || duration < 15 || duration > 480 || duration % 15 !== 0) {
      errors.slotDurationMinutes = 'Slot duration must be an integer multiple of 15 minutes between 15 and 480.';
    }
  }

  // 7. operatingHours
  if (body.operatingHours !== undefined) {
    const hoursErrors = validateOperatingHours(body.operatingHours);
    Object.assign(errors, hoursErrors);
  }

  // 8. status
  if (body.status !== undefined) {
    const statusCheck = validateEnum(body.status, RESOURCE_STATUSES, 'Status');
    if (!statusCheck.isValid) {
      errors.status = statusCheck.error;
    }
  }

  if (Object.keys(errors).length > 0) {
    return next(ApiError.badRequest('Validation failed for resource update.', 'VALIDATION_ERROR', errors));
  }

  next();
}

/**
 * Validates status update (PATCH /api/v1/resources/:resourceId/status).
 */
export function validateUpdateStatus(req, res, next) {
  const body = req.body || {};
  const keys = Object.keys(body);

  if (keys.length === 0 || !body.status) {
    return next(
      ApiError.badRequest('Status field is required.', 'VALIDATION_ERROR', {
        status: 'Status is required.',
      }),
    );
  }

  const unexpectedKeys = keys.filter((key) => key !== 'status');
  if (unexpectedKeys.length > 0) {
    return next(
      ApiError.badRequest(
        `Unexpected fields rejected for status endpoint: ${unexpectedKeys.join(', ')}.`,
        'VALIDATION_ERROR',
        { unexpectedKeys },
      ),
    );
  }

  const statusCheck = validateEnum(body.status, RESOURCE_STATUSES, 'Status');
  if (!statusCheck.isValid) {
    return next(
      ApiError.badRequest(statusCheck.error, 'VALIDATION_ERROR', {
        status: statusCheck.error,
      }),
    );
  }

  next();
}

/**
 * Validates query parameters for public resource discovery (GET /api/v1/resources).
 */
export function validatePublicQuery(req, res, next) {
  const errors = {};
  const query = req.query || {};

  // 1. Pagination
  const paginationResult = validatePagination(query);
  if (!paginationResult.isValid) {
    Object.assign(errors, paginationResult.errors);
  }

  // 2. Search text
  if (query.search !== undefined) {
    if (typeof query.search !== 'string' || query.search.trim().length > 100) {
      errors.search = 'Search query cannot exceed 100 characters.';
    }
  }

  // 3. Category
  if (query.category !== undefined && query.category !== '') {
    const categoryCheck = validateEnum(query.category, RESOURCE_CATEGORIES, 'Category');
    if (!categoryCheck.isValid) {
      errors.category = categoryCheck.error;
    }
  }

  // 4. Location
  if (query.location !== undefined && query.location !== '') {
    if (typeof query.location !== 'string' || query.location.trim().length > 100) {
      errors.location = 'Location query cannot exceed 100 characters.';
    }
  }

  // 5. minCapacity & maxCapacity
  let minCap = null;
  let maxCap = null;

  if (query.minCapacity !== undefined && query.minCapacity !== '') {
    const val = Number(query.minCapacity);
    if (!Number.isInteger(val) || val < 1) {
      errors.minCapacity = 'minCapacity must be an integer greater than or equal to 1.';
    } else {
      minCap = val;
    }
  }

  if (query.maxCapacity !== undefined && query.maxCapacity !== '') {
    const val = Number(query.maxCapacity);
    if (!Number.isInteger(val) || val < 1) {
      errors.maxCapacity = 'maxCapacity must be an integer greater than or equal to 1.';
    } else {
      maxCap = val;
    }
  }

  if (minCap !== null && maxCap !== null && minCap > maxCap) {
    errors.capacityRange = 'minCapacity cannot be greater than maxCapacity.';
  }

  // 6. Sorting
  if (query.sortBy !== undefined && query.sortBy !== '') {
    const sortCheck = validateEnum(query.sortBy, ALLOWED_SORT_FIELDS, 'sortBy');
    if (!sortCheck.isValid) {
      errors.sortBy = sortCheck.error;
    }
  }

  if (query.sortOrder !== undefined && query.sortOrder !== '') {
    const orderCheck = validateEnum(query.sortOrder, ['asc', 'desc'], 'sortOrder');
    if (!orderCheck.isValid) {
      errors.sortOrder = orderCheck.error;
    }
  }

  if (Object.keys(errors).length > 0) {
    return next(ApiError.badRequest('Invalid query parameters.', 'VALIDATION_ERROR', errors));
  }

  // Attach sanitized, typed pagination and filter values
  req.validatedQuery = {
    page: paginationResult.page,
    limit: paginationResult.limit,
    search: query.search ? query.search.trim() : null,
    category: query.category ? query.category.trim() : null,
    location: query.location ? query.location.trim() : null,
    minCapacity: minCap,
    maxCapacity: maxCap,
    sortBy: query.sortBy || 'createdAt',
    sortOrder: query.sortOrder === 'asc' ? 1 : -1,
  };

  next();
}

/**
 * Validates query parameters for administrative resource listing (GET /api/v1/admin/resources).
 * Extends public query validation by allowing a `status` filter.
 */
export function validateAdminQuery(req, res, next) {
  // Run public query checks first
  validatePublicQuery(req, res, (err) => {
    if (err) return next(err);

    const query = req.query || {};
    let status = null;

    if (query.status !== undefined && query.status !== '' && query.status !== 'all') {
      const statusCheck = validateEnum(query.status, RESOURCE_STATUSES, 'Status');
      if (!statusCheck.isValid) {
        return next(
          ApiError.badRequest(statusCheck.error, 'VALIDATION_ERROR', {
            status: statusCheck.error,
          }),
        );
      }
      status = query.status;
    }

    req.validatedQuery.status = status;
    next();
  });
}

/**
 * Validates that a string is a strictly valid calendar date formatted as YYYY-MM-DD.
 * Rejects non-existent dates such as 2026-02-30 or 2026-04-31.
 *
 * @param {string} dateString
 * @returns {boolean}
 */
export function isValidCalendarDate(dateString) {
  if (typeof dateString !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;

  const [yearStr, monthStr, dayStr] = dateString.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (year < 2000 || year > 2100) return false;
  if (month < 1 || month > 12) return false;

  const testDate = new Date(Date.UTC(year, month - 1, day));
  return (
    testDate.getUTCFullYear() === year &&
    testDate.getUTCMonth() === month - 1 &&
    testDate.getUTCDate() === day
  );
}

/**
 * Validates parameters for resource availability discovery:
 * GET /api/v1/resources/:resourceId/availability?date=YYYY-MM-DD
 */
export function validateAvailabilityQuery(req, res, next) {
  const { resourceId } = req.params;
  const { date } = req.query;

  // 1. Validate resource ID
  if (!resourceId || !isValidObjectId(resourceId)) {
    return next(
      ApiError.badRequest(
        'Invalid resource identifier format.',
        'INVALID_RESOURCE_ID',
        { resourceId: 'Must be a valid 24-character hexadecimal ObjectId.' },
      ),
    );
  }

  // 2. Validate date query parameter
  if (!date || typeof date !== 'string') {
    return next(
      ApiError.badRequest(
        'The "date" query parameter is required (format: YYYY-MM-DD).',
        'VALIDATION_ERROR',
        { date: 'Missing required date parameter.' },
      ),
    );
  }

  const trimmedDate = date.trim();
  if (!isValidCalendarDate(trimmedDate)) {
    return next(
      ApiError.badRequest(
        'Invalid date format or impossible calendar date. Expected format: YYYY-MM-DD.',
        'INVALID_DATE',
        { date: 'Must be a valid calendar date formatted as YYYY-MM-DD (e.g. 2026-10-28).' },
      ),
    );
  }

  req.validatedAvailabilityDate = trimmedDate;
  next();
}

export default {
  validateCreateResource,
  validateUpdateResource,
  validateUpdateStatus,
  validateResourceIdParam,
  validatePublicQuery,
  validateAdminQuery,
  validateAvailabilityQuery,
  isValidCalendarDate,
};

