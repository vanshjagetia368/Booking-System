import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { sendError } from '../utils/apiResponse.js';

/**
 * Centralized Express error-handling middleware.
 *
 * Catches all errors forwarded via next(err), formats them to the project
 * standard JSON error schema, masks internal database/server details,
 * and ensures stack traces are never exposed in production.
 */
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'An unexpected internal server error occurred.';
  let code = err.code || 'INTERNAL_ERROR';
  let details = err.details || null;

  // 1. JSON parsing syntax error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON payload received in request body.';
    code = 'INVALID_JSON_BODY';
    details = null;
  }

  // 2. CORS origin rejection
  if (err.message && err.message.startsWith('CORS error:')) {
    statusCode = 403;
    code = 'CORS_ORIGIN_FORBIDDEN';
  }

  // 3. Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for parameter '${err.path}': '${err.value}'.`;
    code = 'INVALID_PARAMETER';
    details = null;
  }

  // 4. Mongoose ValidationError
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 422;
    message = 'Validation failed for one or more fields.';
    code = 'VALIDATION_ERROR';
    details = Object.keys(err.errors).reduce((acc, key) => {
      acc[key] = err.errors[key].message;
      return acc;
    }, {});
  }

  // 5. MongoDB Duplicate Key Conflict (Code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    if (err.keyPattern && (err.keyPattern.slotStartAt || err.keyValue?.slotStartAt)) {
      message = 'One or more requested time slots have already been reserved by a concurrent booking.';
      code = 'BOOKING_CONFLICT';
    } else {
      const duplicatedFields = Object.keys(err.keyPattern || err.keyValue || {});
      const fieldList = duplicatedFields.length > 0 ? duplicatedFields.join(', ') : 'field';
      message = `A record with this ${fieldList} already exists.`;
      code = 'DUPLICATE_KEY_CONFLICT';
    }
    details = err.keyValue || null;
  }

  // Log 500 errors to the console in development/server logs (without sensitive tokens)
  if (statusCode >= 500) {
    console.error(`[Server Error] ${req.method} ${req.originalUrl}:`, err);
  }

  return sendError(res, {
    statusCode,
    message,
    code,
    details,
    stack: err.stack,
  });
}

export default errorHandler;
