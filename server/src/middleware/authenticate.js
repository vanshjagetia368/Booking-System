import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { verifyAuthToken } from '../services/auth.service.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Authentication middleware that verifies JWT from HTTP-only cookie
 * or Authorization: Bearer <token> header.
 *
 * Attaches the sanitized authenticated user to `req.user` and the ID to `req.userId`.
 */
export async function authenticate(req, res, next) {
  try {
    let token = null;

    // 1. Check HTTP-only cookie first
    if (req.cookies && req.cookies[env.cookie.name]) {
      token = req.cookies[env.cookie.name];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // 2. Fall back to Authorization: Bearer <token> header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization.trim();
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      }
    }

    if (!token) {
      return next(
        ApiError.unauthorized('Authentication is required to access this resource.', 'AUTHENTICATION_REQUIRED'),
      );
    }

    // 3. Cryptographically verify token
    let decoded;
    try {
      decoded = verifyAuthToken(token);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return next(
          ApiError.unauthorized('Authentication session has expired. Please sign in again.', 'TOKEN_EXPIRED'),
        );
      }
      return next(
        ApiError.unauthorized('Invalid authentication token.', 'TOKEN_INVALID'),
      );
    }

    if (!decoded || !decoded.id) {
      return next(
        ApiError.unauthorized('Invalid authentication token payload.', 'TOKEN_INVALID'),
      );
    }

    // 4. Retrieve and verify user existence and account status
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(
        ApiError.unauthorized('The user associated with this token no longer exists.', 'USER_NOT_FOUND'),
      );
    }

    if (user.status !== 'active') {
      return next(
        ApiError.forbidden(
          'Your account has been deactivated. Please contact an administrator.',
          'ACCOUNT_DISABLED',
        ),
      );
    }

    // 5. Attach safe user object to request context (without password hash)
    req.user = user.toSafeObject();
    req.userId = user._id.toString();

    next();
  } catch (error) {
    next(error);
  }
}

export default authenticate;
