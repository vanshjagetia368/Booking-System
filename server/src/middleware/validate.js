import { ApiError } from '../utils/ApiError.js';

/**
 * Reusable request validation middleware generator.
 *
 * Validates request `body`, `query`, and `params` against provided validator functions.
 *
 * @param {object} schemas
 * @param {(body: unknown) => { isValid: boolean, errors?: Record<string, string> }} [schemas.body]
 * @param {(query: unknown) => { isValid: boolean, errors?: Record<string, string> }} [schemas.query]
 * @param {(params: unknown) => { isValid: boolean, errors?: Record<string, string> }} [schemas.params]
 * @returns {import('express').RequestHandler}
 */
export function validate(schemas = {}) {
  return (req, res, next) => {
    const allErrors = {};

    if (schemas.params && typeof schemas.params === 'function') {
      const result = schemas.params(req.params);
      if (!result.isValid && result.errors) {
        Object.assign(allErrors, result.errors);
      }
    }

    if (schemas.query && typeof schemas.query === 'function') {
      const result = schemas.query(req.query);
      if (!result.isValid && result.errors) {
        Object.assign(allErrors, result.errors);
      }
    }

    if (schemas.body && typeof schemas.body === 'function') {
      const result = schemas.body(req.body);
      if (!result.isValid && result.errors) {
        Object.assign(allErrors, result.errors);
      }
    }

    if (Object.keys(allErrors).length > 0) {
      return next(
        new ApiError(400, 'Validation failed for one or more fields.', 'VALIDATION_ERROR', allErrors),
      );
    }

    next();
  };
}

export default validate;
