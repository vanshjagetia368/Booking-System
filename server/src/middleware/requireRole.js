import { ApiError } from '../utils/ApiError.js';

/**
 * Role-based authorization middleware generator.
 *
 * Restricts access to authenticated users possessing one of the specified roles.
 * Must be mounted after the `authenticate` middleware.
 *
 * @param {string | string[]} roles - Required role(s) (e.g. 'admin' or ['admin'])
 * @returns {import('express').RequestHandler}
 */
export function requireRole(roles) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    // 1. Verify that the user has already been authenticated
    if (!req.user) {
      return next(
        ApiError.unauthorized('Authentication is required before checking authorization.', 'AUTHENTICATION_REQUIRED'),
      );
    }

    // 2. Enforce server-side role check from validated req.user
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access forbidden. This action requires ${allowedRoles.join(' or ')} privileges.`,
          'INSUFFICIENT_PERMISSIONS',
        ),
      );
    }

    next();
  };
}

export default requireRole;
