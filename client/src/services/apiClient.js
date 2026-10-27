import { config } from '../app/config.js';

/**
 * Structured API Error class representing an HTTP error, network failure, or API conflict.
 */
export class ApiError extends Error {
  /**
   * @param {string} message - Human-readable error message.
   * @param {object} [options]
   * @param {number} [options.status=500] - HTTP status code (0 for network failure).
   * @param {string} [options.statusText=''] - HTTP status text.
   * @param {string} [options.code='UNKNOWN_ERROR'] - Machine-readable error code.
   * @param {object | null} [options.details=null] - Validation error details or conflict payload.
   * @param {unknown} [options.data=null] - Raw response payload.
   */
  constructor(message, { status = 500, statusText = '', code = 'UNKNOWN_ERROR', details = null, data = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.code = code;
    this.details = details;
    this.data = data;
  }

  /**
   * Indicates whether the failure was due to network disconnection or server unreachable.
   */
  get isNetworkError() {
    return this.status === 0 || this.code === 'NETWORK_ERROR';
  }

  /**
   * Indicates whether the failure was due to missing or expired authentication.
   */
  get isAuthError() {
    return this.status === 401 || this.code === 'AUTHENTICATION_REQUIRED' || this.code === 'TOKEN_EXPIRED';
  }

  /**
   * Indicates whether the failure was due to insufficient permissions.
   */
  get isForbidden() {
    return this.status === 403 || this.code === 'FORBIDDEN_INSUFFICIENT_PERMISSIONS';
  }

  /**
   * Indicates whether the requested resource was not found.
   */
  get isNotFound() {
    return this.status === 404 || this.code === 'RESOURCE_NOT_FOUND' || this.code === 'BOOKING_NOT_FOUND';
  }

  /**
   * Indicates whether the request resulted in a scheduling or resource conflict.
   */
  get isConflict() {
    return (
      this.status === 409 ||
      this.code === 'BOOKING_CONFLICT' ||
      this.code === 'MAINTENANCE_BOOKING_CONFLICT' ||
      this.code === 'MAINTENANCE_OVERLAP_CONFLICT'
    );
  }

  /**
   * Indicates whether the request failed validation.
   */
  get isValidationError() {
    return this.status === 400 || this.status === 422 || this.code === 'VALIDATION_ERROR';
  }

  /**
   * Indicates whether the failure was a server-side error.
   */
  get isServerError() {
    return this.status >= 500;
  }
}

/**
 * Builds a valid query string from an object, safely encoding keys and values.
 * Supports arrays (repeated keys), booleans, numbers, and strings.
 *
 * @param {Record<string, unknown>} [params]
 * @returns {string} Formatted query string with leading '?' or empty string.
 */
export function buildQueryString(params) {
  if (!params || typeof params !== 'object') {
    return '';
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null && item !== '') {
          searchParams.append(key, String(item));
        }
      }
    } else {
      searchParams.append(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

/**
 * Executes an HTTP request against the configured backend API.
 *
 * @param {string} endpoint - Path relative to base URL (e.g. '/resources' or 'health')
 * @param {RequestInit & { params?: Record<string, unknown> }} [options={}]
 * @returns {Promise<any>} Parsed response data
 */
export async function apiRequest(endpoint, options = {}) {
  const { params, headers = {}, body, ...customOptions } = options;

  // Build clean URL without duplicate slashes
  const baseUrl = (config.apiBaseUrl || 'http://localhost:5000/api/v1').replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  const url = `${baseUrl}/${cleanEndpoint}${buildQueryString(params)}`;

  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  let formattedBody = body;
  // Automatically JSON-serialize standard objects/arrays
  if (
    body &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof URLSearchParams)
  ) {
    requestHeaders['Content-Type'] = 'application/json';
    formattedBody = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, {
      credentials: 'include', // Mandated for HTTP-only cookie authentication
      ...customOptions,
      headers: requestHeaders,
      body: formattedBody,
    });
  } catch (networkError) {
    throw new ApiError(
      networkError?.message || 'Failed to connect to the backend server. Please verify your network connection.',
      {
        status: 0,
        statusText: 'Network Error',
        code: 'NETWORK_ERROR',
      },
    );
  }

  // Safely parse content according to Content-Type header
  const contentType = response.headers.get('content-type') || '';
  let payload = null;

  if (contentType.includes('application/json')) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  } else {
    try {
      payload = await response.text();
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    let errorCode = 'UNKNOWN_ERROR';
    let errorDetails = null;

    if (payload && typeof payload === 'object') {
      errorMessage = payload.message || payload.error || errorMessage;
      errorCode = payload.code || (response.status === 404 ? 'NOT_FOUND' : 'API_ERROR');
      errorDetails = payload.details || null;
    } else if (typeof payload === 'string' && payload.trim().length > 0) {
      // Guard against HTML error pages returned by web servers
      errorMessage = payload.startsWith('<')
        ? `Server error (${response.status} ${response.statusText || 'Error'})`
        : payload;
      errorCode = `HTTP_${response.status}`;
    }

    throw new ApiError(errorMessage, {
      status: response.status,
      statusText: response.statusText,
      code: errorCode,
      details: errorDetails,
      data: payload,
    });
  }

  return payload;
}

/**
 * Centralized API client methods for standard HTTP verbs.
 */
export const apiClient = {
  request: apiRequest,

  get(endpoint, options = {}) {
    return apiRequest(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint, body, options = {}) {
    return apiRequest(endpoint, { ...options, method: 'POST', body });
  },

  put(endpoint, body, options = {}) {
    return apiRequest(endpoint, { ...options, method: 'PUT', body });
  },

  patch(endpoint, body, options = {}) {
    return apiRequest(endpoint, { ...options, method: 'PATCH', body });
  },

  delete(endpoint, options = {}) {
    return apiRequest(endpoint, { ...options, method: 'DELETE' });
  },
};

export default apiClient;
