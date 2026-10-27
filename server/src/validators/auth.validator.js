import { isValidEmail, isNonEmptyString } from './common.js';

/**
 * Validates public user registration requests.
 * Enforces mass-assignment protection by explicitly rejecting privileged fields.
 *
 * @param {unknown} body
 * @returns {{ isValid: boolean, errors?: Record<string, string> }}
 */
export function validateRegister(body) {
  const errors = {};

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      isValid: false,
      errors: { body: 'Request body must be a valid JSON object.' },
    };
  }

  // 1. Mass Assignment Protection: Disallow privileged or unexpected fields
  const forbiddenFields = ['role', 'status', 'id', '_id', 'createdAt', 'updatedAt'];
  for (const field of forbiddenFields) {
    if (field in body) {
      errors[field] = `Specifying '${field}' is not permitted during public registration.`;
    }
  }

  // 2. Validate Name
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.name = 'Full name is required.';
  } else if (!isNonEmptyString(body.name, 2, 100)) {
    errors.name = 'Name must be between 2 and 100 characters long.';
  }

  // 3. Validate Email
  if (!body.email || typeof body.email !== 'string' || body.email.trim().length === 0) {
    errors.email = 'Email address is required.';
  } else if (!isValidEmail(body.email)) {
    errors.email = 'Please provide a valid email address.';
  }

  // 4. Validate Password
  if (!body.password || typeof body.password !== 'string') {
    errors.password = 'Password is required.';
  } else if (body.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long.';
  } else if (body.password.length > 128) {
    errors.password = 'Password cannot exceed 128 characters.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    ...(Object.keys(errors).length > 0 ? { errors } : {}),
  };
}

/**
 * Validates login credentials.
 *
 * @param {unknown} body
 * @returns {{ isValid: boolean, errors?: Record<string, string> }}
 */
export function validateLogin(body) {
  const errors = {};

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      isValid: false,
      errors: { body: 'Request body must be a valid JSON object.' },
    };
  }

  if (!body.email || typeof body.email !== 'string' || body.email.trim().length === 0) {
    errors.email = 'Email address is required.';
  } else if (!isValidEmail(body.email)) {
    errors.email = 'Please provide a valid email address.';
  }

  if (!body.password || typeof body.password !== 'string' || body.password.length === 0) {
    errors.password = 'Password is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    ...(Object.keys(errors).length > 0 ? { errors } : {}),
  };
}

export default {
  validateRegister,
  validateLogin,
};
