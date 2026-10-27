import {
  registerUser,
  loginUser,
  setAuthCookie,
  clearAuthCookie,
} from '../services/auth.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * Handle new user registration.
 *
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export async function register(req, res) {
  const { name, email, password } = req.body;

  const result = await registerUser({ name, email, password });

  // Set HTTP-only cookie for browser clients
  setAuthCookie(res, result.token);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'User registered successfully.',
    data: {
      user: result.user,
      token: result.token,
    },
  });
}

/**
 * Handle user login.
 *
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export async function login(req, res) {
  const { email, password } = req.body;

  const result = await loginUser({ email, password });

  // Set HTTP-only cookie for browser clients
  setAuthCookie(res, result.token);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Login successful.',
    data: {
      user: result.user,
      token: result.token,
    },
  });
}

/**
 * Handle user logout.
 * Clears the authentication cookie from the client.
 *
 * @route   POST /api/v1/auth/logout
 * @access  Public / Authenticated
 */
export function logout(req, res) {
  clearAuthCookie(res);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Logged out successfully.',
  });
}

/**
 * Retrieve the current authenticated user's profile.
 *
 * @route   GET /api/v1/auth/me
 * @access  Authenticated
 */
export function getMe(req, res) {
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Current user profile retrieved.',
    data: {
      user: req.user,
    },
  });
}

export default {
  register,
  login,
  logout,
  getMe,
};
