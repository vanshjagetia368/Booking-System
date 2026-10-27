import apiClient from '../../../services/apiClient.js';

/**
 * Authentication Service
 *
 * Communicates with backend authentication endpoints:
 * - Registration (POST /auth/register)
 * - Login (POST /auth/login)
 * - Logout (POST /auth/logout)
 * - Current User Profile (GET /auth/me)
 *
 * Uses credentials: 'include' under the hood via apiClient for HTTP-only cookie session handling.
 */
export const authService = {
  /**
   * Registers a new user account.
   *
   * @param {object} params
   * @param {string} params.name - Full user name (2-100 characters)
   * @param {string} params.email - Valid institutional or personal email
   * @param {string} params.password - Secure password (min 8 characters)
   * @returns {Promise<{ user: object, token: string }>}
   */
  async register({ name, email, password }) {
    const payload = {
      name: name?.trim(),
      email: email?.trim().toLowerCase(),
      password,
    };

    const response = await apiClient.post('/auth/register', payload);
    return response?.data || response;
  },

  /**
   * Authenticates user credentials and establishes a session cookie.
   *
   * @param {object} params
   * @param {string} params.email
   * @param {string} params.password
   * @returns {Promise<{ user: object, token: string }>}
   */
  async login({ email, password }) {
    const payload = {
      email: email?.trim().toLowerCase(),
      password,
    };

    const response = await apiClient.post('/auth/login', payload);
    return response?.data || response;
  },

  /**
   * Terminates the current authenticated session on the backend.
   *
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async logout() {
    const response = await apiClient.post('/auth/logout');
    return response;
  },

  /**
   * Retrieves the currently authenticated user's profile.
   *
   * @returns {Promise<{ user: object }>}
   */
  async getMe() {
    const response = await apiClient.get('/auth/me');
    return response?.data || response;
  },
};

export default authService;
