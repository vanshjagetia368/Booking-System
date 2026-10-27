import { env } from '../config/env.js';

/**
 * Standardized success response sender.
 *
 * Output format:
 * {
 *   "success": true,
 *   "message": "...",
 *   "data": { ... },
 *   "meta": { ... }
 * }
 *
 * @param {import('express').Response} res
 * @param {object} options
 * @param {number} [options.statusCode=200]
 * @param {string} [options.message='Success']
 * @param {unknown} [options.data=null]
 * @param {unknown} [options.meta=null]
 */
export function sendSuccess(res, { statusCode = 200, message = 'Success', data = null, meta = null } = {}) {
  const payload = {
    success: true,
    message,
    ...(data !== null && data !== undefined ? { data } : {}),
    ...(meta !== null && meta !== undefined ? { meta } : {}),
  };

  return res.status(statusCode).json(payload);
}

/**
 * Standardized error response sender.
 *
 * Output format:
 * {
 *   "success": false,
 *   "message": "...",
 *   "code": "ERROR_CODE",
 *   "data": { ... },
 *   "details": { ... },
 *   "stack": "..." (development only)
 * }
 *
 * @param {import('express').Response} res
 * @param {object} options
 * @param {number} [options.statusCode=500]
 * @param {string} [options.message='An unexpected error occurred']
 * @param {string} [options.code='INTERNAL_ERROR']
 * @param {unknown} [options.data=null]
 * @param {unknown} [options.details=null]
 * @param {string} [options.stack=null]
 */
export function sendError(res, {
  statusCode = 500,
  message = 'An unexpected error occurred',
  code = 'INTERNAL_ERROR',
  data = null,
  details = null,
  stack = null,
} = {}) {
  const payload = {
    success: false,
    message,
    code,
    ...(data !== null && data !== undefined ? { data } : {}),
    ...(details !== null && details !== undefined ? { details } : {}),
    // Exclude stack trace in production environments
    ...(env.isDevelopment && stack ? { stack } : {}),
  };

  return res.status(statusCode).json(payload);
}

export default {
  sendSuccess,
  sendError,
};
