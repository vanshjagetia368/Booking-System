import { ApiError } from '../services/apiClient.js';

/**
 * Normalizes an unknown error into a clean, user-friendly display message.
 *
 * @param {unknown} error - The caught error object, string, or ApiError.
 * @param {string} [fallbackMessage='An unexpected error occurred. Please try again.']
 * @returns {string} Formatted error message suitable for UI display.
 */
export function normalizeErrorMessage(
  error,
  fallbackMessage = 'An unexpected error occurred. Please try again.',
) {
  if (!error) {
    return fallbackMessage;
  }

  if (typeof error === 'string') {
    return error.trim() || fallbackMessage;
  }

  if (error instanceof ApiError) {
    // If we have an explicit message from the server response
    if (error.message && error.message.trim().length > 0) {
      return error.message;
    }

    // Default messages based on HTTP status codes
    switch (error.status) {
      case 400:
        return 'Invalid request details. Please check your input.';
      case 401:
        return 'Please sign in to access this resource.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource could not be found.';
      case 409:
        return 'A scheduling conflict occurred. The selected slot is no longer available.';
      case 422:
        return 'The request could not be processed due to validation constraints.';
      case 500:
      case 502:
      case 503:
        return 'The booking service is temporarily unavailable. Please try again later.';
      default:
        return fallbackMessage;
    }
  }

  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }

  return fallbackMessage;
}
