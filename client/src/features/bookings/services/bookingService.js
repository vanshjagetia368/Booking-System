import apiClient from '../../../services/apiClient.js';

/**
 * Booking Service
 *
 * Communicates with the Express backend booking lifecycle endpoints:
 * - Create reservation (POST /api/v1/bookings)
 * - Get booking by ID (GET /api/v1/bookings/:bookingId)
 * - Get user bookings history (GET /api/v1/bookings/my)
 */
export const bookingService = {
  /**
   * Submits a reservation request for an authenticated user with atomic slot allocation.
   *
   * Mass assignment defense: Only submits permitted fields [resourceId, startAt, endAt, notes].
   * The authenticated user ownership is strictly derived by the server from JWT cookies.
   *
   * @param {object} params
   * @param {string} params.resourceId - 24-character hexadecimal MongoDB ObjectId
   * @param {string} params.startAt - ISO 8601 instant string with timezone (e.g. 2026-10-28T10:00:00.000Z)
   * @param {string} params.endAt - ISO 8601 instant string with timezone (e.g. 2026-10-28T10:30:00.000Z)
   * @param {string} [params.notes=''] - Optional reservation notes (max 1000 chars)
   * @returns {Promise<object>} Confirmed server booking record
   */
  async createBooking({ resourceId, startAt, endAt, notes = '' }) {
    if (!resourceId) {
      throw new Error('Resource identifier is required to create a booking.');
    }
    if (!startAt || !endAt) {
      throw new Error('Start and end timestamps are required to create a booking.');
    }

    const payload = {
      resourceId,
      startAt: typeof startAt === 'string' ? startAt : new Date(startAt).toISOString(),
      endAt: typeof endAt === 'string' ? endAt : new Date(endAt).toISOString(),
    };

    if (notes && typeof notes === 'string' && notes.trim().length > 0) {
      payload.notes = notes.trim();
    }

    const response = await apiClient.post('/bookings', payload);
    return response?.data?.booking || response?.data || response;
  },

  /**
   * Retrieves an authoritative booking record by its unique identifier.
   *
   * @param {string} bookingId - 24-character hexadecimal MongoDB ObjectId
   * @returns {Promise<object>} Populated booking entity
   */
  async getBookingById(bookingId) {
    if (!bookingId) {
      throw new Error('Booking identifier is required.');
    }

    const response = await apiClient.get(`/bookings/${encodeURIComponent(bookingId)}`);
    return response?.data?.booking || response?.data || response;
  },

  /**
   * Allowed query parameters for booking history inspection (matches backend whitelist).
   */
  ALLOWED_HISTORY_PARAMS: ['page', 'limit', 'status', 'resourceId', 'fromDate', 'toDate'],

  /**
   * Retrieves paginated booking history for the current user.
   *
   * Sanitizes query parameters to prevent sending unpermitted keys that backend rejects.
   *
   * @param {object} [params={}] - Optional query filters (status, resourceId, page, limit, fromDate, toDate)
   * @returns {Promise<{ bookings: Array<object>, pagination: object }>}
   */
  async getUserBookings(params = {}) {
    const sanitizedParams = {};
    const allowed = ['page', 'limit', 'status', 'resourceId', 'fromDate', 'toDate'];

    for (const key of allowed) {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        sanitizedParams[key] = params[key];
      }
    }

    const response = await apiClient.get('/bookings/my', { params: sanitizedParams });
    const meta = response?.meta || {};
    const bookings = response?.data?.bookings || [];

    return {
      bookings,
      pagination: {
        page: Number(meta.page) || 1,
        limit: Number(meta.limit) || 10,
        totalItems: meta.totalItems !== undefined ? Number(meta.totalItems) : bookings.length,
        totalPages: meta.totalPages !== undefined ? Number(meta.totalPages) : 1,
        hasNextPage: Boolean(meta.hasNextPage),
        hasPrevPage: Boolean(meta.hasPrevPage),
      },
    };
  },

  /**
   * Cancels a confirmed booking and releases its active slot allocations.
   *
   * @param {object} params
   * @param {string} params.bookingId - 24-character hexadecimal MongoDB ObjectId
   * @param {string} [params.reason=null] - Optional cancellation reason (max 500 chars)
   * @returns {Promise<object>} Server-confirmed cancelled booking record
   */
  async cancelBooking({ bookingId, reason = null }) {
    if (!bookingId) {
      throw new Error('Booking identifier is required for cancellation.');
    }

    const payload = {};
    if (reason && typeof reason === 'string' && reason.trim().length > 0) {
      payload.reason = reason.trim().slice(0, 500);
    }

    const response = await apiClient.patch(
      `/bookings/${encodeURIComponent(bookingId)}/cancel`,
      payload,
    );
    return response?.data?.booking || response?.data || response;
  },

  /**
   * Reschedules a confirmed booking to a new time interval with atomic reallocation.
   *
   * @param {object} params
   * @param {string} params.bookingId - 24-character hexadecimal MongoDB ObjectId
   * @param {string | Date} params.startAt - ISO 8601 instant string with timezone
   * @param {string | Date} params.endAt - ISO 8601 instant string with timezone
   * @returns {Promise<{ booking: object, slots: Array<object> }>} Updated booking record
   */
  async rescheduleBooking({ bookingId, startAt, endAt }) {
    if (!bookingId) {
      throw new Error('Booking identifier is required for rescheduling.');
    }
    if (!startAt || !endAt) {
      throw new Error('Replacement start and end timestamps are required.');
    }

    const payload = {
      startAt: typeof startAt === 'string' ? startAt : new Date(startAt).toISOString(),
      endAt: typeof endAt === 'string' ? endAt : new Date(endAt).toISOString(),
    };

    const response = await apiClient.patch(
      `/bookings/${encodeURIComponent(bookingId)}/reschedule`,
      payload,
    );
    return {
      booking: response?.data?.booking || response?.data || response,
      slots: response?.data?.slots || [],
    };
  },
};

export default bookingService;
