import { config } from '../app/config.js';

/**
 * Custom error class representing an API or network error.
 */
export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {object} [details]
   * @param {number} [details.status=500]
   * @param {string} [details.statusText='']
   * @param {unknown} [details.data=null]
   */
  constructor(message, { status = 500, statusText = '', data = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

/**
 * Converts a key-value object to a URL search parameter string.
 *
 * @param {Record<string, unknown>} [params]
 * @returns {string} Formatted query string with leading '?' or empty string.
 */
function buildQueryString(params) {
  if (!params || typeof params !== 'object') {
    return '';
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

/**
 * Executes an HTTP request against the configured backend API.
 *
 * @param {string} endpoint - Path relative to the base URL (e.g. '/resources')
 * @param {RequestInit & { params?: Record<string, unknown> }} [options={}]
 * @returns {Promise<unknown>}
 */
export async function apiRequest(endpoint, options = {}) {
  const { params, headers = {}, body, ...customOptions } = options;

  // Build clean URL without double slashes
  const baseUrl = config.apiBaseUrl.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  const url = `${baseUrl}/${cleanEndpoint}${buildQueryString(params)}`;

  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  let formattedBody = body;
  // Automatically serialize JavaScript objects/arrays
  if (
    body &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !(body instanceof Blob)
  ) {
    requestHeaders['Content-Type'] = 'application/json';
    formattedBody = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, {
      credentials: 'include',
      ...customOptions,
      headers: requestHeaders,
      body: formattedBody,
    });
  } catch (networkError) {
    throw new ApiError(
      networkError?.message || 'Failed to connect to the backend server. Please verify network connectivity.',
      { status: 0, statusText: 'Network Error' },
    );
  }

  // Safely parse according to content type
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

    if (payload && typeof payload === 'object') {
      errorMessage = payload.message || payload.error || errorMessage;
    } else if (typeof payload === 'string' && payload.trim().length > 0) {
      // Guard against HTML error pages
      errorMessage = payload.startsWith('<')
        ? `Server error (${response.status} ${response.statusText || 'Error'})`
        : payload;
    }

    throw new ApiError(errorMessage, {
      status: response.status,
      statusText: response.statusText,
      data: payload,
    });
  }

  return payload;
}

/**
 * Centralized API client methods for common HTTP verbs.
 */
export const apiClient = {
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
