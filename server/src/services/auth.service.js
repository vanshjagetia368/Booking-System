import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Signs a short-lived JSON Web Token for an authenticated user.
 *
 * @param {object} user - User document or safe user object
 * @returns {string} Signed JWT string
 */
export function generateAuthToken(user) {
  const userId = user._id ? user._id.toString() : user.id;

  const payload = {
    id: userId,
    role: user.role,
  };

  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

/**
 * Cryptographically verifies an access token.
 *
 * @param {string} token
 * @returns {object} Decoded token payload
 */
export function verifyAuthToken(token) {
  return jwt.verify(token, env.jwt.secret);
}

/**
 * Sets the secure HTTP-only authentication cookie on the response.
 *
 * @param {import('express').Response} res
 * @param {string} token
 */
export function setAuthCookie(res, token) {
  res.cookie(env.cookie.name, token, {
    httpOnly: env.cookie.httpOnly,
    secure: env.cookie.secure,
    sameSite: env.cookie.sameSite,
    maxAge: env.cookie.maxAge,
    path: env.cookie.path,
  });
}

/**
 * Clears the authentication cookie during logout.
 *
 * @param {import('express').Response} res
 */
export function clearAuthCookie(res) {
  res.clearCookie(env.cookie.name, {
    httpOnly: env.cookie.httpOnly,
    secure: env.cookie.secure,
    sameSite: env.cookie.sameSite,
    path: env.cookie.path,
  });
}

/**
 * Registers a new user with the default 'user' role.
 *
 * @param {object} data
 * @param {string} data.name
 * @param {string} data.email
 * @param {string} data.password
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function registerUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  // Check for existing user with identical email
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw ApiError.conflict('An account with this email address already exists.', 'EMAIL_ALREADY_EXISTS');
  }

  // Create user with explicit public fields (disallow mass-assignment of role/status)
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: 'user',
    status: 'active',
  });

  const token = generateAuthToken(user);
  return {
    user: user.toSafeObject(),
    token,
  };
}

/**
 * Authenticates user credentials and returns safe profile and token.
 *
 * @param {object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  // Retrieve user including the password hash for comparison
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  // Guard against timing attacks and revealing account presence
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
  }

  // Check if account has been disabled by an administrator
  if (user.status !== 'active') {
    throw ApiError.forbidden(
      'Your account has been deactivated. Please contact an administrator.',
      'ACCOUNT_DISABLED',
    );
  }

  const token = generateAuthToken(user);
  return {
    user: user.toSafeObject(),
    token,
  };
}

/**
 * Retrieves the current authenticated user's profile.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
export async function getUserProfile(userId) {
  const user = await User.findById(userId);

  if (!user) {
    throw ApiError.notFound('The authenticated user profile could not be found.', 'USER_NOT_FOUND');
  }

  if (user.status !== 'active') {
    throw ApiError.forbidden(
      'Your account has been deactivated. Please contact an administrator.',
      'ACCOUNT_DISABLED',
    );
  }

  return user.toSafeObject();
}

export default {
  generateAuthToken,
  verifyAuthToken,
  setAuthCookie,
  clearAuthCookie,
  registerUser,
  loginUser,
  getUserProfile,
};
